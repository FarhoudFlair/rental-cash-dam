# Rental Cash Damming Calculator

This calculator helps analyze the benefits and costs of implementing a Rental Cash Damming strategy, which is a variation of the Smith Manoeuvre specifically for rental properties.

## What is Rental Cash Damming?

Rental Cash Damming is a strategy that involves:
1. Using a HELOC to pay rental property expenses
2. Using rental income to pay down the primary residence mortgage
3. Converting non-deductible mortgage debt into tax-deductible HELOC debt
4. Maximizing retained rental income and deferring taxes

## Features

- Web-based interface for easy input and visualization
- Calculates traditional mortgage payments and interest
- Calculates HELOC + Mortgage payments and interest when using the strategy
- Shows the difference in interest costs
- Calculates tax savings from deductible HELOC interest
- Provides net benefit analysis
- Generates detailed monthly and yearly reports
- Interactive charts and tables for better visualization

## Installation

1. Ensure you have Python 3.7+ installed
2. Install required packages:
```bash
pip install -r requirements.txt
```

## Usage

1. Start the web application:
```bash
python app.py
```

2. Open your web browser and navigate to `http://localhost:5000`

3. Enter your financial parameters in the web interface:
   - Rental Property Details:
     - Monthly rental income
     - Monthly rental expenses (excluding mortgage)
     - Rental mortgage balance, interest rate, term, and amortization
   - Primary Residence Details:
     - Primary mortgage balance, interest rate, term, and amortization
   - HELOC Details:
     - HELOC balance and interest rate
   - Other Parameters:
     - Tax rate
     - Simulation period (in years)

4. Click "Calculate" to see the results

## Output

The calculator provides:
1. A summary showing:
   - Total interest paid in both scenarios
   - Total tax savings
   - Net benefit of the strategy
   - Final balances for all loans
2. Detailed monthly breakdown showing:
   - Traditional mortgage balance and interest
   - Strategy mortgage balance and interest
   - HELOC balance and interest
   - Tax savings
   - Net interest difference
   - Net benefit
3. Interactive charts visualizing:
   - Loan balances over time
   - Interest payments comparison
   - Cumulative benefits

## Important Notes

- This calculator assumes you're using the HELOC to pay its own interest (capitalizing the interest)
- The strategy works best with a long-term investment horizon
- Consult with a financial advisor before implementing this strategy
- Tax laws and regulations may vary by jurisdiction 