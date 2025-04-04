document.addEventListener('DOMContentLoaded', function() {
    // Get the calculate button and add event listener
    const calculateBtn = document.getElementById('calculateBtn');
    calculateBtn.addEventListener('click', performCalculations);
    
    // Charts storage
    let mortgageBalanceChart = null;
    let investmentGrowthChart = null;
    let cashFlowChart = null;
    let netWorthChart = null;
    
    function performCalculations() {
        // Get all user inputs
        const inputs = getInputValues();
        
        // Run the calculations
        const results = calculateSmithManoeuvre(inputs);
        
        // Display the results
        displayResults(results);
        
        // Create or update charts
        createCharts(results);
        
        // Create annual breakdown table
        createAnnualBreakdownTable(results);
    }
    
    function getInputValues() {
        return {
            // Primary Residence
            homeValue: parseFloat(document.getElementById('homeValue').value),
            mortgageBalance: parseFloat(document.getElementById('mortgageBalance').value),
            mortgageRate: parseFloat(document.getElementById('mortgageRate').value) / 100,
            mortgageAmortization: parseInt(document.getElementById('mortgageAmortization').value),
            mortgagePaymentFrequency: document.getElementById('mortgagePaymentFrequency').value,
            
            // Rental Property
            rentalValue: parseFloat(document.getElementById('rentalValue').value),
            rentalMortgageBalance: parseFloat(document.getElementById('rentalMortgageBalance').value),
            rentalMortgageRate: parseFloat(document.getElementById('rentalMortgageRate').value) / 100,
            rentalMortgageAmortization: parseInt(document.getElementById('rentalMortgageAmortization').value),
            monthlyRent: parseFloat(document.getElementById('monthlyRent').value),
            monthlyRentalExpenses: parseFloat(document.getElementById('monthlyRentalExpenses').value),
            
            // HELOC & Investment Details
            helocRate: parseFloat(document.getElementById('helocRate').value) / 100,
            investmentReturnRate: parseFloat(document.getElementById('investmentReturnRate').value) / 100,
            dividendYieldRate: parseFloat(document.getElementById('dividendYieldRate').value) / 100,
            marginalTaxRate: parseFloat(document.getElementById('marginalTaxRate').value) / 100,
            inflationRate: parseFloat(document.getElementById('inflationRate').value) / 100,
            
            // Strategy Options
            useRentalCashDamming: document.getElementById('useRentalCashDamming').checked,
            useSmithManoeuvre: document.getElementById('useSmithManoeuvre').checked,
            useCapitalizeInterest: document.getElementById('useCapitalizeInterest').checked,
            useDividendsToPayMortgage: document.getElementById('useDividendsToPayMortgage').checked,
            useTaxRefundToPayMortgage: document.getElementById('useTaxRefundToPayMortgage').checked,
            
            // Simulation Length
            simulationYears: parseInt(document.getElementById('simulationYears').value)
        };
    }
    
    function calculateSmithManoeuvre(inputs) {
        // Calculate the mortgage payments
        const paymentFrequencyMultiplier = getPaymentFrequencyMultiplier(inputs.mortgagePaymentFrequency);
        
        // Calculate regular mortgage payment based on payment frequency
        const regularPayment = calculateMortgagePayment(
            inputs.mortgageBalance, 
            inputs.mortgageRate, 
            inputs.mortgageAmortization, 
            inputs.mortgagePaymentFrequency
        );
        
        const rentalPayment = calculateMortgagePayment(
            inputs.rentalMortgageBalance,
            inputs.rentalMortgageRate,
            inputs.rentalMortgageAmortization,
            'monthly'
        );
        
        // Initialize tracking variables for original scenario (no Smith Manoeuvre)
        const originalScenario = {
            mortgageBalance: [inputs.mortgageBalance],
            rentalMortgageBalance: [inputs.rentalMortgageBalance],
            interestPaid: 0,
            rentalInterestPaid: 0,
            payoffTime: inputs.mortgageAmortization,
            netWorth: [],
            cashFlow: []
        };
        
        // Initialize tracking variables for Smith Manoeuvre strategy
        const smithScenario = {
            mortgageBalance: [inputs.mortgageBalance],
            rentalMortgageBalance: [inputs.rentalMortgageBalance],
            helocBalance: [0],
            investmentValue: [0],
            dividends: [0],
            taxDeductions: [0],
            taxRefunds: [0],
            interestPaid: 0,
            rentalInterestPaid: 0,
            helocInterestPaid: 0,
            payoffTime: null,
            netWorth: [],
            cashFlow: []
        };
        
        // Calculate initial net worth for both scenarios
        originalScenario.netWorth.push(
            inputs.homeValue - inputs.mortgageBalance + 
            inputs.rentalValue - inputs.rentalMortgageBalance
        );
        
        smithScenario.netWorth.push(
            inputs.homeValue - inputs.mortgageBalance + 
            inputs.rentalValue - inputs.rentalMortgageBalance
        );
        
        // Calculate initial cash flow
        const initialRentalCashFlow = inputs.monthlyRent - inputs.monthlyRentalExpenses - rentalPayment;
        originalScenario.cashFlow.push(initialRentalCashFlow);
        smithScenario.cashFlow.push(initialRentalCashFlow);
        
        // Simulation variables
        const totalMonths = inputs.simulationYears * 12;
        const paymentsPerYear = paymentFrequencyMultiplier;
        const totalPayments = inputs.simulationYears * paymentsPerYear;
        const monthsPerPayment = 12 / paymentsPerYear;
        
        let mortgagePayoffMonth = inputs.mortgageAmortization * 12;
        let strategyPayoffMonth = null;
        
        // Run the simulation month by month
        for (let month = 1; month <= totalMonths; month++) {
            // ======= ORIGINAL SCENARIO CALCULATIONS =======
            // Calculate regular mortgage payment (if still paying)
            if (originalScenario.mortgageBalance[month - 1] > 0) {
                const interestPortion = originalScenario.mortgageBalance[month - 1] * inputs.mortgageRate / paymentsPerYear;
                originalScenario.interestPaid += interestPortion;
                
                const principalPortion = regularPayment - interestPortion;
                const newMortgageBalance = Math.max(0, originalScenario.mortgageBalance[month - 1] - principalPortion);
                originalScenario.mortgageBalance.push(newMortgageBalance);
            } else {
                originalScenario.mortgageBalance.push(0);
            }
            
            // Calculate rental mortgage payment (if still paying)
            if (originalScenario.rentalMortgageBalance[month - 1] > 0) {
                const rentalInterestPortion = originalScenario.rentalMortgageBalance[month - 1] * inputs.rentalMortgageRate / 12;
                originalScenario.rentalInterestPaid += rentalInterestPortion;
                
                const rentalPrincipalPortion = rentalPayment - rentalInterestPortion;
                const newRentalMortgageBalance = Math.max(0, originalScenario.rentalMortgageBalance[month - 1] - rentalPrincipalPortion);
                originalScenario.rentalMortgageBalance.push(newRentalMortgageBalance);
            } else {
                originalScenario.rentalMortgageBalance.push(0);
            }
            
            // Update original cash flow - this will change over time as the rental mortgage is paid down
            const originalMonthlyRentalCashFlow = inputs.monthlyRent - inputs.monthlyRentalExpenses;
            let originalMonthlyCashFlow;
            
            if (originalScenario.rentalMortgageBalance[month] > 0) {
                originalMonthlyCashFlow = originalMonthlyRentalCashFlow - rentalPayment;
            } else {
                originalMonthlyCashFlow = originalMonthlyRentalCashFlow;
            }
            
            originalScenario.cashFlow.push(originalMonthlyCashFlow);
            
            // ======= SMITH MANOEUVRE STRATEGY CALCULATIONS =======
            // Initial values for this month
            let currentMortgageBalance = smithScenario.mortgageBalance[month - 1];
            let currentRentalMortgageBalance = smithScenario.rentalMortgageBalance[month - 1];
            let currentHelocBalance = smithScenario.helocBalance[month - 1];
            let currentInvestmentValue = smithScenario.investmentValue[month - 1];
            
            // Investment growth for this month
            const monthlyGrowthRate = Math.pow(1 + inputs.investmentReturnRate, 1/12) - 1;
            const investmentGrowth = currentInvestmentValue * monthlyGrowthRate;
            currentInvestmentValue += investmentGrowth;
            
            // Calculate dividends
            const monthlyDividendYield = inputs.dividendYieldRate / 12;
            const dividends = currentInvestmentValue * monthlyDividendYield;
            smithScenario.dividends.push(dividends);
            
            // Calculate mortgage payment (if still paying)
            if (currentMortgageBalance > 0) {
                const interestPortion = currentMortgageBalance * inputs.mortgageRate / paymentsPerYear;
                smithScenario.interestPaid += interestPortion;
                
                let principalPortion = regularPayment - interestPortion;
                
                // Apply dividends to mortgage if that option is selected
                if (inputs.useDividendsToPayMortgage && dividends > 0) {
                    principalPortion += dividends;
                }
                
                // Check if we're on a month where tax refund would arrive (April)
                const isRefundMonth = month % 12 === 4; // April
                if (isRefundMonth && month > 12 && inputs.useTaxRefundToPayMortgage) {
                    // Get the refund from previous year
                    const previousYearRefund = smithScenario.taxRefunds[Math.floor(month / 12) - 1];
                    principalPortion += previousYearRefund;
                }
                
                currentMortgageBalance = Math.max(0, currentMortgageBalance - principalPortion);
                
                // If this is the first time the mortgage is fully paid, record the payoff month
                if (currentMortgageBalance === 0 && smithScenario.mortgageBalance[month - 1] > 0) {
                    strategyPayoffMonth = month;
                }
                
                // Calculate equity created and amount to borrow for Smith Manoeuvre
                let equityCreated = principalPortion;
                if (inputs.useSmithManoeuvre && currentMortgageBalance > 0) {
                    // Borrow the principal portion for investment
                    currentHelocBalance += equityCreated;
                    currentInvestmentValue += equityCreated;
                }
            }
            
            // Rental Cash Damming - use rental income to pay down primary mortgage
            if (inputs.useRentalCashDamming && currentMortgageBalance > 0) {
                const rentalNetIncome = inputs.monthlyRent - inputs.monthlyRentalExpenses;
                
                // Use rental net income to pay down primary mortgage
                currentMortgageBalance = Math.max(0, currentMortgageBalance - rentalNetIncome);
                
                // Borrow to pay rental expenses and mortgage
                const rentalInterestPortion = currentRentalMortgageBalance * inputs.rentalMortgageRate / 12;
                const rentalMortgagePayment = rentalPayment;
                
                currentHelocBalance += inputs.monthlyRentalExpenses + rentalMortgagePayment;
                
                // Record interest paid on rental mortgage
                smithScenario.rentalInterestPaid += rentalInterestPortion;
                
                // If this is the first time the mortgage is fully paid, record the payoff month
                if (currentMortgageBalance === 0 && smithScenario.mortgageBalance[month - 1] > 0 && !strategyPayoffMonth) {
                    strategyPayoffMonth = month;
                }
            } else {
                // Normal rental mortgage payment if not doing cash damming
                if (currentRentalMortgageBalance > 0) {
                    const rentalInterestPortion = currentRentalMortgageBalance * inputs.rentalMortgageRate / 12;
                    smithScenario.rentalInterestPaid += rentalInterestPortion;
                    
                    const rentalPrincipalPortion = rentalPayment - rentalInterestPortion;
                    currentRentalMortgageBalance = Math.max(0, currentRentalMortgageBalance - rentalPrincipalPortion);
                }
            }
            
            // Calculate HELOC interest and capitalize it if that option is selected
            const helocInterestMonth = currentHelocBalance * inputs.helocRate / 12;
            smithScenario.helocInterestPaid += helocInterestMonth;
            
            // Tax deduction from the HELOC interest
            const monthlyTaxDeduction = helocInterestMonth;
            
            // Add up tax deductions by year
            const yearIndex = Math.floor((month - 1) / 12);
            if (!smithScenario.taxDeductions[yearIndex]) {
                smithScenario.taxDeductions[yearIndex] = 0;
            }
            smithScenario.taxDeductions[yearIndex] += monthlyTaxDeduction;
            
            // Calculate tax refunds (simplified - assumes refund comes in the year after deductions)
            if (month % 12 === 0) { // End of year calculations
                const yearlyTaxDeduction = smithScenario.taxDeductions[yearIndex];
                const taxRefund = yearlyTaxDeduction * inputs.marginalTaxRate;
                smithScenario.taxRefunds[yearIndex] = taxRefund;
            }
            
            // If capitalizing interest, add the interest to the HELOC balance
            if (inputs.useCapitalizeInterest) {
                currentHelocBalance += helocInterestMonth;
            }
            
            // Store updated values
            smithScenario.mortgageBalance.push(currentMortgageBalance);
            smithScenario.rentalMortgageBalance.push(currentRentalMortgageBalance);
            smithScenario.helocBalance.push(currentHelocBalance);
            smithScenario.investmentValue.push(currentInvestmentValue);
            
            // Calculate net worth and cash flow for Smith Manoeuvre scenario
            const smithNetWorth = 
                inputs.homeValue - currentMortgageBalance + 
                inputs.rentalValue - currentRentalMortgageBalance + 
                currentInvestmentValue - currentHelocBalance;
            
            smithScenario.netWorth.push(smithNetWorth);
            
            // Calculate Smith Manoeuvre cash flow
            let smithMonthlyCashFlow;
            
            if (inputs.useRentalCashDamming) {
                // If using rental cash damming, all rental expenses are on HELOC
                smithMonthlyCashFlow = inputs.monthlyRent; // All rent is profit
                
                // If not capitalizing interest, subtract HELOC interest
                if (!inputs.useCapitalizeInterest) {
                    smithMonthlyCashFlow -= helocInterestMonth;
                }
            } else {
                // Normal cash flow calculation
                smithMonthlyCashFlow = inputs.monthlyRent - inputs.monthlyRentalExpenses;
                
                // If rental mortgage still being paid
                if (currentRentalMortgageBalance > 0) {
                    smithMonthlyCashFlow -= rentalPayment;
                }
                
                // If not capitalizing interest, subtract HELOC interest
                if (!inputs.useCapitalizeInterest) {
                    smithMonthlyCashFlow -= helocInterestMonth;
                }
            }
            
            smithScenario.cashFlow.push(smithMonthlyCashFlow);
        }
        
        // Calculate payoff times in years
        smithScenario.payoffTime = strategyPayoffMonth ? strategyPayoffMonth / 12 : inputs.mortgageAmortization;
        
        // Process annual data for charts and table
        const years = Array.from({length: inputs.simulationYears + 1}, (_, i) => i);
        
        const annualData = years.map(year => {
            const monthIndex = year * 12;
            
            // If current year is beyond simulation, use the last value
            const safeIndex = Math.min(monthIndex, smithScenario.mortgageBalance.length - 1);
            
            return {
                year: year,
                originalMortgageBalance: originalScenario.mortgageBalance[safeIndex] || 0,
                originalRentalMortgageBalance: originalScenario.rentalMortgageBalance[safeIndex] || 0,
                originalNetWorth: originalScenario.netWorth[safeIndex] || 0,
                originalCashFlow: originalScenario.cashFlow[safeIndex] || 0,
                
                smithMortgageBalance: smithScenario.mortgageBalance[safeIndex] || 0,
                smithRentalMortgageBalance: smithScenario.rentalMortgageBalance[safeIndex] || 0,
                smithHelocBalance: smithScenario.helocBalance[safeIndex] || 0,
                smithInvestmentValue: smithScenario.investmentValue[safeIndex] || 0,
                smithNetWorth: smithScenario.netWorth[safeIndex] || 0,
                smithCashFlow: smithScenario.cashFlow[safeIndex] || 0,
                taxRefund: smithScenario.taxRefunds[year - 1] || 0
            };
        });
        
        return {
            inputs: inputs,
            original: originalScenario,
            smith: smithScenario,
            annualData: annualData
        };
    }
    
    function displayResults(results) {
        // Display mortgage acceleration results
        document.getElementById('originalPayoffTime').textContent = results.original.payoffTime.toFixed(2) + ' years';
        document.getElementById('strategyPayoffTime').textContent = results.smith.payoffTime.toFixed(2) + ' years';
        document.getElementById('yearsSaved').textContent = (results.original.payoffTime - results.smith.payoffTime).toFixed(2) + ' years';
        
        // Display interest savings
        document.getElementById('originalInterest').textContent = formatCurrency(results.original.interestPaid);
        document.getElementById('strategyInterest').textContent = formatCurrency(results.smith.interestPaid + results.smith.helocInterestPaid);
        document.getElementById('interestSavings').textContent = formatCurrency(results.original.interestPaid - (results.smith.interestPaid + results.smith.helocInterestPaid));
        
        // Display investment growth
        const finalMonth = results.inputs.simulationYears * 12;
        document.getElementById('investmentValue').textContent = formatCurrency(results.smith.investmentValue[finalMonth]);
        document.getElementById('helocBalance').textContent = formatCurrency(results.smith.helocBalance[finalMonth]);
        document.getElementById('netInvestmentValue').textContent = formatCurrency(results.smith.investmentValue[finalMonth] - results.smith.helocBalance[finalMonth]);
        
        // Display tax benefits
        const totalTaxDeductions = results.smith.taxDeductions.reduce((sum, deduction) => sum + deduction, 0);
        const totalTaxRefunds = results.smith.taxRefunds.reduce((sum, refund) => sum + refund, 0);
        document.getElementById('totalTaxDeductions').textContent = formatCurrency(totalTaxDeductions);
        document.getElementById('totalTaxRefunds').textContent = formatCurrency(totalTaxRefunds);
        document.getElementById('avgAnnualRefund').textContent = formatCurrency(totalTaxRefunds / results.inputs.simulationYears);
        
        // Display rental cash flow
        document.getElementById('originalMonthlyCashFlow').textContent = formatCurrency(results.original.cashFlow[finalMonth]);
        document.getElementById('strategyMonthlyCashFlow').textContent = formatCurrency(results.smith.cashFlow[finalMonth]);
        document.getElementById('cashFlowImprovement').textContent = formatCurrency(results.smith.cashFlow[finalMonth] - results.original.cashFlow[finalMonth]);
        
        // Display net worth impact
        document.getElementById('originalNetWorth').textContent = formatCurrency(results.original.netWorth[finalMonth]);
        document.getElementById('strategyNetWorth').textContent = formatCurrency(results.smith.netWorth[finalMonth]);
        document.getElementById('netWorthImprovement').textContent = formatCurrency(results.smith.netWorth[finalMonth] - results.original.netWorth[finalMonth]);
    }
    
    function createCharts(results) {
        const years = results.annualData.map(d => d.year);
        
        // Mortgage Balance Chart
        const mortgageCtx = document.getElementById('mortgageBalanceChart').getContext('2d');
        if (mortgageBalanceChart) {
            mortgageBalanceChart.destroy();
        }
        
        mortgageBalanceChart = new Chart(mortgageCtx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Original Mortgage Balance',
                        data: results.annualData.map(d => d.originalMortgageBalance),
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        fill: true
                    },
                    {
                        label: 'Strategy Mortgage Balance',
                        data: results.annualData.map(d => d.smithMortgageBalance),
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Mortgage Balance Over Time'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatCurrency(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
        
        // Investment Growth Chart
        const investmentCtx = document.getElementById('investmentGrowthChart').getContext('2d');
        if (investmentGrowthChart) {
            investmentGrowthChart.destroy();
        }
        
        investmentGrowthChart = new Chart(investmentCtx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Investment Value',
                        data: results.annualData.map(d => d.smithInvestmentValue),
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        fill: true
                    },
                    {
                        label: 'HELOC Balance',
                        data: results.annualData.map(d => d.smithHelocBalance),
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        fill: true
                    },
                    {
                        label: 'Net Investment Value',
                        data: results.annualData.map(d => d.smithInvestmentValue - d.smithHelocBalance),
                        borderColor: '#f39c12',
                        backgroundColor: 'rgba(243, 156, 18, 0.1)',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Investment Growth vs HELOC Balance'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatCurrency(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
        
        // Cash Flow Chart
        const cashFlowCtx = document.getElementById('cashFlowChart').getContext('2d');
        if (cashFlowChart) {
            cashFlowChart.destroy();
        }
        
        cashFlowChart = new Chart(cashFlowCtx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Original Monthly Cash Flow',
                        data: results.annualData.map(d => d.originalCashFlow * 12), // Annualized
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        fill: true
                    },
                    {
                        label: 'Strategy Monthly Cash Flow',
                        data: results.annualData.map(d => d.smithCashFlow * 12), // Annualized
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Annual Cash Flow Comparison'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatCurrency(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
        
        // Net Worth Chart
        const netWorthCtx = document.getElementById('netWorthChart').getContext('2d');
        if (netWorthChart) {
            netWorthChart.destroy();
        }
        
        netWorthChart = new Chart(netWorthCtx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Original Net Worth',
                        data: results.annualData.map(d => d.originalNetWorth),
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        fill: true
                    },
                    {
                        label: 'Strategy Net Worth',
                        data: results.annualData.map(d => d.smithNetWorth),
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Net Worth Comparison'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatCurrency(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function createAnnualBreakdownTable(results) {
        const tableBody = document.getElementById('annualBreakdownTable').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        
        results.annualData.forEach(data => {
            const row = tableBody.insertRow();
            
            // Add cells with data
            row.insertCell().textContent = data.year;
            row.insertCell().textContent = formatCurrency(data.smithMortgageBalance);
            row.insertCell().textContent = formatCurrency(data.smithHelocBalance);
            row.insertCell().textContent = formatCurrency(data.smithInvestmentValue);
            row.insertCell().textContent = formatCurrency(data.taxRefund);
            row.insertCell().textContent = formatCurrency(data.smithNetWorth);
        });
    }
    
    // Helper Functions
    function getPaymentFrequencyMultiplier(frequency) {
        switch (frequency) {
            case 'monthly':
                return 12;
            case 'biweekly':
                return 26;
            case 'accelerated':
                return 26;
            default:
                return 12;
        }
    }
    
    function calculateMortgagePayment(principal, interestRate, amortizationYears, frequency) {
        const paymentFrequencyMultiplier = getPaymentFrequencyMultiplier(frequency);
        const totalPayments = amortizationYears * paymentFrequencyMultiplier;
        const periodicInterestRate = interestRate / paymentFrequencyMultiplier;
        
        // Special handling for accelerated bi-weekly
        if (frequency === 'accelerated') {
            // Accelerated bi-weekly is half the monthly payment, but paid 26 times per year
            const monthlyPayment = (principal * periodicInterestRate * Math.pow(1 + periodicInterestRate, totalPayments)) /
                                (Math.pow(1 + periodicInterestRate, totalPayments) - 1);
            return monthlyPayment / 2;
        }
        
        // Regular payment calculation
        return (principal * periodicInterestRate * Math.pow(1 + periodicInterestRate, totalPayments)) /
               (Math.pow(1 + periodicInterestRate, totalPayments) - 1);
    }
    
    function formatCurrency(value) {
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }
    
    // Initialize with a calculation on load
    performCalculations();
});