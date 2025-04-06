import numpy as np
from dataclasses import dataclass
from typing import List, Tuple
import pandas as pd

@dataclass
class LoanParameters:
    balance: float
    interest_rate: float
    term_years: int
    amortization_years: int

@dataclass
class RentalProperty:
    income: float
    mortgage: LoanParameters
    expenses: float

class RentalCashDammingCalculator:
    def __init__(
        self,
        rental_properties: List[RentalProperty],
        primary_mortgage: LoanParameters,
        heloc: LoanParameters,
        tax_rate: float,
    ):
        self.rental_properties = rental_properties
        self.primary_mortgage = primary_mortgage
        self.heloc = heloc
        self.tax_rate = tax_rate
        
        # Calculate total rental income and expenses
        self.total_rental_income = sum(prop.income for prop in rental_properties)
        self.total_rental_expenses = sum(prop.expenses for prop in rental_properties)
        
        # Monthly interest rates
        self.primary_mortgage_monthly_rate = primary_mortgage.interest_rate / 12 / 100
        self.heloc_monthly_rate = heloc.interest_rate / 12 / 100
        
        # Calculate initial monthly payments for each rental mortgage using index as key
        self.rental_mortgage_payments = {
            i: self._calculate_monthly_payment(
                prop.mortgage.balance,
                prop.mortgage.interest_rate,
                prop.mortgage.amortization_years
            ) for i, prop in enumerate(rental_properties)
        }
        
        # Calculate total rental mortgage payment
        self.total_rental_mortgage_payment = sum(self.rental_mortgage_payments.values())
        
        # Primary mortgage payment will be recalculated at term end
        self.initial_primary_payment = self._calculate_monthly_payment(
            primary_mortgage.balance,
            primary_mortgage.interest_rate,
            primary_mortgage.amortization_years
        )

    def _calculate_monthly_payment(
        self, 
        principal: float, 
        annual_rate: float, 
        years: int
    ) -> float:
        """Calculate monthly payment for a loan."""
        if principal <= 0 or years <= 0:
            return 0
        monthly_rate = annual_rate / 12 / 100
        num_payments = years * 12
        if monthly_rate == 0:
             return principal / num_payments if num_payments > 0 else 0
        payment = principal * (monthly_rate * (1 + monthly_rate)**num_payments) / ((1 + monthly_rate)**num_payments - 1)
        # Ensure payment doesn't exceed remaining balance + interest for the month
        min_payment = principal * (1 + monthly_rate) 
        return min(payment, min_payment) if payment > principal else payment

    def calculate_monthly_interest(self, balance: float, monthly_rate: float) -> float:
        """Calculate monthly interest for a loan."""
        return max(0, balance * monthly_rate)

    def calculate_amortization_schedule(self, months: int) -> pd.DataFrame:
        """Calculate amortization schedule for both scenarios."""
        schedule = []
        
        # Initial balances
        trad_primary_balance = self.primary_mortgage.balance
        strat_primary_balance = self.primary_mortgage.balance
        heloc_balance = self.heloc.balance
        
        # Initial primary payment and remaining amortization
        trad_primary_payment = self.initial_primary_payment
        strat_primary_payment = self.initial_primary_payment
        primary_remaining_amort_years = self.primary_mortgage.amortization_years
        
        term_months = self.primary_mortgage.term_years * 12
        months_in_term = 0

        for month in range(1, months + 1):
            months_in_term += 1
            
            # --- Traditional Scenario --- 
            trad_primary_interest = self.calculate_monthly_interest(
                trad_primary_balance, 
                self.primary_mortgage_monthly_rate
            )
            # Adjust payment if it exceeds remaining balance + interest
            current_trad_payment = min(trad_primary_payment, trad_primary_balance + trad_primary_interest)
            trad_primary_principal = current_trad_payment - trad_primary_interest
            trad_primary_balance -= trad_primary_principal
            trad_primary_balance = max(0, trad_primary_balance) # Ensure balance doesn't go below zero

            # --- Strategy Scenario --- 
            if strat_primary_balance > 0:
                # --- Rental Cash Damming & Paydown Logic (Only when Primary Mortgage has balance) --- 
                strat_primary_interest = self.calculate_monthly_interest(
                    strat_primary_balance, 
                    self.primary_mortgage_monthly_rate
                )
                # Determine standard payment amount for this month
                current_strat_payment = min(strat_primary_payment, strat_primary_balance + strat_primary_interest)
                strat_primary_principal_component = max(0, current_strat_payment - strat_primary_interest)
                
                # Total funds available for primary mortgage paydown this month
                total_funds_for_primary_paydown = strat_primary_principal_component + self.total_rental_income
                
                # Amount actually applied to primary mortgage (cannot exceed remaining balance)
                actual_primary_paydown = min(total_funds_for_primary_paydown, strat_primary_balance)
                
                # Apply paydown to primary mortgage
                strat_primary_balance -= actual_primary_paydown
                strat_primary_balance = max(0, strat_primary_balance) # Ensure balance is not negative
                
                # Calculate excess funds to be applied to HELOC
                excess_funds_for_heloc_paydown = total_funds_for_primary_paydown - actual_primary_paydown
                
                # 1. Calculate total rental expenses to be paid by HELOC
                total_rental_outflows = self.total_rental_expenses + self.total_rental_mortgage_payment
                
                # 2. Increase HELOC balance by rental outflows
                heloc_balance += total_rental_outflows
                
                # 3. Apply excess funds (from primary payment + rental income) to pay down HELOC
                heloc_paydown_amount = min(excess_funds_for_heloc_paydown, heloc_balance) # Cannot pay down more than balance
                heloc_balance -= heloc_paydown_amount
                heloc_balance = max(0, heloc_balance)

                # 4. Calculate HELOC interest (based on balance AFTER adding expenses and applying paydown)
                heloc_interest = self.calculate_monthly_interest(
                    heloc_balance, 
                    self.heloc_monthly_rate
                )
                
                # 5. Capitalize HELOC interest: Pay HELOC interest with HELOC balance
                heloc_balance += heloc_interest
                # --- End Rental Cash Damming & Paydown Logic ---
            
            else: # strat_primary_balance is <= 0, switch to direct HELOC payment, but continue cash damming
                strat_primary_interest = 0
                strat_primary_principal_component = 0 # No more primary payments

                # --- Continue Rental Cash Damming on HELOC ---
                # 1. Calculate total rental expenses to be paid by HELOC
                total_rental_outflows = self.total_rental_expenses + self.total_rental_mortgage_payment

                # 2. Increase HELOC balance by rental outflows (borrowing for expenses)
                heloc_balance += total_rental_outflows

                # 3. Determine funds available for HELOC paydown
                #    Using rental income + the freed-up initial primary payment amount.
                available_for_heloc_paydown = self.total_rental_income + self.initial_primary_payment

                # 4. Apply paydown to HELOC
                actual_heloc_payment = min(available_for_heloc_paydown, heloc_balance) # Cannot pay more than balance
                heloc_balance -= actual_heloc_payment
                heloc_balance = max(0, heloc_balance) # Ensure balance is non-negative

                # 5. Calculate HELOC interest (based on balance AFTER adding expenses and applying paydown)
                heloc_interest = self.calculate_monthly_interest(
                    heloc_balance,
                    self.heloc_monthly_rate
                )

                # 6. Capitalize HELOC interest
                heloc_balance += heloc_interest
                # --- End Rental Cash Damming on HELOC ---

            # --- Common calculations for both scenarios (after primary is paid or not) ---
            heloc_balance = max(0, heloc_balance) # Final check for non-negative HELOC balance
            
            # Calculate tax savings from deductible HELOC interest 
            # (Interest is deductible because funds were used for rental expenses/mortgage)
            # Note: This assumes ALL HELOC interest is deductible due to this process.
            tax_savings = heloc_interest * self.tax_rate
            
            # Calculate net benefit for the month
            net_benefit = trad_primary_interest - strat_primary_interest - heloc_interest + tax_savings
            
            schedule.append({
                'Month': month,
                'Traditional_Primary_Balance': trad_primary_balance,
                'Traditional_Primary_Interest': trad_primary_interest,
                'Strategy_Primary_Balance': strat_primary_balance,
                'Strategy_Primary_Interest': strat_primary_interest,
                'HELOC_Balance': heloc_balance,
                'HELOC_Interest': heloc_interest,
                'Tax_Savings': tax_savings,
                'Net_Benefit': net_benefit
            })

            # --- Mortgage Renewal Check (End of Term) ---
            if months_in_term == term_months and month < months:
                months_in_term = 0
                primary_remaining_amort_years -= self.primary_mortgage.term_years
                primary_remaining_amort_years = max(0, primary_remaining_amort_years)
                
                # Recalculate primary payment for both scenarios based on remaining balance & amort
                # Assuming rate stays the same for simplicity
                if trad_primary_balance > 0 and primary_remaining_amort_years > 0:
                    trad_primary_payment = self._calculate_monthly_payment(
                        trad_primary_balance, 
                        self.primary_mortgage.interest_rate, 
                        primary_remaining_amort_years
                    )
                else:
                    trad_primary_payment = 0
                    
                if strat_primary_balance > 0 and primary_remaining_amort_years > 0:
                    strat_primary_payment = self._calculate_monthly_payment(
                        strat_primary_balance, 
                        self.primary_mortgage.interest_rate, 
                        primary_remaining_amort_years
                    )
                else:
                     strat_primary_payment = 0
        
        df_schedule = pd.DataFrame(schedule)
        
        # Add cumulative net benefit column
        if not df_schedule.empty:
            df_schedule['Cumulative_Net_Benefit'] = df_schedule['Net_Benefit'].cumsum()
            df_schedule['Cumulative_Tax_Savings'] = df_schedule['Tax_Savings'].cumsum()
            df_schedule['Cumulative_Traditional_Interest'] = df_schedule['Traditional_Primary_Interest'].cumsum()
            df_schedule['Cumulative_Strategy_Interest'] = df_schedule['Strategy_Primary_Interest'].cumsum()
            df_schedule['Cumulative_HELOC_Interest'] = df_schedule['HELOC_Interest'].cumsum()
            
        return df_schedule

    def generate_summary(self, months: int) -> pd.DataFrame:
        """Generate summary statistics for the analysis period."""
        schedule = self.calculate_amortization_schedule(months)
        
        if schedule.empty:
            # Return empty or default summary if schedule calculation fails or returns empty
            return pd.DataFrame([{ 
                'Total_Traditional_Interest': 0,
                'Total_Strategy_Interest': 0,
                'Total_Tax_Savings': 0,
                'Net_Benefit': 0,
                'Final_Traditional_Balance': self.primary_mortgage.balance, 
                'Final_Strategy_Balance': self.primary_mortgage.balance, 
                'Final_HELOC_Balance': self.heloc.balance
             }])
             
        # Calculate summary based on the generated schedule
        summary_net_benefit = schedule['Net_Benefit'].sum()
        summary_total_trad_interest = schedule['Traditional_Primary_Interest'].sum()
        summary_total_strat_interest = (schedule['Strategy_Primary_Interest'] + schedule['HELOC_Interest']).sum()
        summary_total_tax_savings = schedule['Tax_Savings'].sum()
        
        summary = {
            'Total_Traditional_Interest': summary_total_trad_interest,
            'Total_Strategy_Interest': summary_total_strat_interest,
            'Total_Tax_Savings': summary_total_tax_savings,
            'Net_Benefit': summary_net_benefit, 
            'Final_Traditional_Balance': schedule['Traditional_Primary_Balance'].iloc[-1],
            'Final_Strategy_Balance': schedule['Strategy_Primary_Balance'].iloc[-1],
            'Final_HELOC_Balance': schedule['HELOC_Balance'].iloc[-1]
        }
        
        return pd.DataFrame([summary]) 