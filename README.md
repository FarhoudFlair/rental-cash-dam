# Rental Cash Damming Calculator

This calculator helps analyze the benefits and costs of implementing a Rental Cash Damming strategy, which is a variation of the Smith Manoeuvre specifically for rental properties.

## What is Rental Cash Damming?

Rental Cash Damming is a strategy that involves:
1. Using a HELOC to pay rental property expenses
2. Using rental income to pay down the primary residence mortgage
3. Converting non-deductible mortgage debt into tax-deductible HELOC debt
4. Maximizing retained rental income and deferring taxes

## Features

- Calculates traditional mortgage payments and interest
- Calculates HELOC + Mortgage payments and interest when using the strategy
- Shows the difference in interest costs
- Calculates tax savings from deductible HELOC interest
- Provides net benefit analysis
- Generates detailed monthly and yearly reports

## Installation

1. Ensure you have Python 3.7+ installed
2. Install required packages:
```bash
pip install -r requirements.txt
```

## Usage

1. Modify the parameters in the `main()` function of `rental_cash_damming_calculator.py` to match your situation:

```python
calculator = RentalCashDammingCalculator(
    rental_income=2000,  # Monthly rental income
    rental_mortgage=LoanParameters(
        balance=300000,
        interest_rate=4.5,
        term_years=5,
        amortization_years=25
    ),
    primary_mortgage=LoanParameters(
        balance=500000,
        interest_rate=3.5,
        term_years=5,
        amortization_years=25
    ),
    heloc=LoanParameters(
        balance=0,
        interest_rate=5.5,
        term_years=999,  # HELOC doesn't have a term
        amortization_years=999
    ),
    tax_rate=0.40,  # 40% tax rate
    rental_expenses=500  # Monthly rental expenses excluding mortgage
)
```

2. Run the calculator:
```bash
python rental_cash_damming_calculator.py
```

## Output

The calculator provides:
1. A 5-year summary showing total interest paid, tax savings, and net benefits
2. Monthly details for the first year showing:
   - Traditional mortgage balance and interest
   - Strategy mortgage balance and interest
   - HELOC balance and interest
   - Tax savings
   - Net interest difference
   - Net benefit

## Important Notes

- This calculator assumes you're using the HELOC to pay its own interest (capitalizing the interest)
- The strategy works best with a long-term investment horizon
- Consult with a financial advisor before implementing this strategy
- Tax laws and regulations may vary by jurisdiction 