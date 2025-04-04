from flask import Flask, render_template, request, jsonify
from rental_cash_damming_calculator import RentalCashDammingCalculator, LoanParameters

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json()
        
        # Extract rental mortgage parameters
        rental_mortgage = LoanParameters(
            balance=float(data['rental_mortgage_balance']),
            interest_rate=float(data['rental_mortgage_rate']),
            term_years=int(data['rental_mortgage_term']),
            amortization_years=int(data['rental_mortgage_amortization'])
        )
        
        # Extract primary mortgage parameters
        primary_mortgage = LoanParameters(
            balance=float(data['primary_mortgage_balance']),
            interest_rate=float(data['primary_mortgage_rate']),
            term_years=int(data['primary_mortgage_term']),
            amortization_years=int(data['primary_mortgage_amortization'])
        )
        
        # Extract HELOC parameters
        heloc = LoanParameters(
            balance=float(data['heloc_balance']),
            interest_rate=float(data['heloc_rate']),
            term_years=999,  # HELOC doesn't have a term
            amortization_years=999
        )
        
        # Create calculator instance
        calculator = RentalCashDammingCalculator(
            rental_income=float(data['rental_income']),
            rental_mortgage=rental_mortgage,
            primary_mortgage=primary_mortgage,
            heloc=heloc,
            tax_rate=float(data['tax_rate']),
            rental_expenses=float(data['rental_expenses'])
        )
        
        # Calculate schedules based on simulation years
        simulation_years = int(data['simulation_years'])
        months = simulation_years * 12
        schedule = calculator.calculate_amortization_schedule(months)
        summary = calculator.generate_summary(months)
        
        # Convert to JSON-friendly format
        schedule_data = schedule.to_dict(orient='records')
        summary_data = summary.to_dict(orient='records')[0]
        
        return jsonify({
            'success': True,
            'schedule': schedule_data,
            'summary': summary_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    app.run(debug=True) 