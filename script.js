
/* =================================
   CALCNOVA
   Stage 5: Calculator Engine
================================= */

// 1. Connect HTML elements
const currentValueDisplay = document.getElementById("currentValue");
const previousOperationDisplay = document.getElementById("previousOperation");


const buttons = document.querySelectorAll(
  ".btn, .history-toggle, .clear-history, .theme-toggle"
);


// 2. Calculator memory
let currentInput = "0";

let expressionTokens = [];

let waitingForSecondOperand = false;
let justCalculated = false;


let calculationHistory = JSON.parse(
  localStorage.getItem("calcNovaHistory")
) || [];

const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");


// 3. Update calculator display
function updateDisplay() {
    currentValueDisplay.textContent = currentInput;
}


// 4. Format calculation results
function formatResult(number) {
    return String(Number(number.toPrecision(12)));
}


// 5. Enter numbers
function enterNumber(number) {

    if (waitingForSecondOperand || justCalculated) {
        currentInput = number;

        waitingForSecondOperand = false;
        justCalculated = false;

    } else if (currentInput === "0") {
        currentInput = number;

    } else {
        currentInput += number;
    }

    updateDisplay();
}


// 6. Enter decimal point
function enterDecimal() {

    if (waitingForSecondOperand || justCalculated) {
        currentInput = "0.";

        waitingForSecondOperand = false;
        justCalculated = false;

    } else if (!currentInput.includes(".")) {
        currentInput += ".";
    }

    updateDisplay();
}


// 7. Clear calculator

function clearCalculator() {
  currentInput = "0";
  expressionTokens = [];

  waitingForSecondOperand = false;
  justCalculated = false;

  previousOperationDisplay.textContent = "Ready to calculate";

  updateDisplay();
}



// 8. Delete last character
function deleteNumber() {

    if (waitingForSecondOperand || justCalculated) {
        return;
    }

    currentInput = currentInput.slice(0, -1);

    if (currentInput === "" || currentInput === "-") {
        currentInput = "0";
    }

    updateDisplay();
}


// 9. Change positive/negative sign
function changeSign() {

    if (currentInput === "0" || currentInput === "0.") {
        return;
    }

    if (currentInput.startsWith("-")) {
        currentInput = currentInput.slice(1);
    } else {
        currentInput = "-" + currentInput;
    }

    updateDisplay();
}


// 10. Perform arithmetic
function performCalculation(first, second, operation) {

    switch (operation) {

        case "+":
            return first + second;

        case "-":
            return first - second;

        case "*":
            return first * second;

        case "/":
            if (second === 0) {
                return "ERROR";
            }

            return first / second;

        default:
            return second;
    }
}


function evaluateExpression(tokens) {
  const values = [...tokens];

  // First: multiplication and division
  for (let i = 1; i < values.length - 1;) {
    const operation = values[i];

    if (operation === "*" || operation === "/") {
      const result = performCalculation(
        Number(values[i - 1]),
        Number(values[i + 1]),
        operation
      );

      if (result === "ERROR") {
        return "ERROR";
      }

      values.splice(i - 1, 3, result);

      // Check the same position again
      i = Math.max(1, i - 2);
    } else {
      i += 2;
    }
  }

  // Second: addition and subtraction
  let result = Number(values[0]);

  for (let i = 1; i < values.length - 1; i += 2) {
    result = performCalculation(
      result,
      Number(values[i + 1]),
      values[i]
    );
  }

  return result;
}


// 11. Select an operator

function chooseOperator(nextOperator) {
  if (currentInput === "Error") {
    clearCalculator();
    return;
  }

  // If an operator was just selected, replace it
  if (waitingForSecondOperand) {
    expressionTokens[expressionTokens.length - 1] =
      nextOperator;
  } else {
    // Add the current number and operator
    expressionTokens.push(Number(currentInput));
    expressionTokens.push(nextOperator);
  }

  waitingForSecondOperand = true;
  justCalculated = false;

  const expressionText = expressionTokens
    .map(function(token) {
      if (token === "*") return "×";
      if (token === "/") return "÷";
      return token;
    })
    .join(" ");

  previousOperationDisplay.textContent = expressionText;

  updateDisplay();
}



// 12. Calculate the result

function calculate() {
  if (
    expressionTokens.length === 0 ||
    waitingForSecondOperand ||
    currentInput === "Error"
  ) {
    return;
  }

  const tokens = [
    ...expressionTokens,
    Number(currentInput)
  ];

  const result = evaluateExpression(tokens);

  if (result === "ERROR" || !Number.isFinite(result)) {
    showError();
    return;
  }

  const formattedResult = formatResult(result);

  const expressionText = tokens
    .map(function(token) {
      if (token === "*") return "×";
      if (token === "/") return "÷";
      return token;
    })
    .join(" ");

  previousOperationDisplay.textContent =
    `${expressionText} =`;

  calculationHistory.unshift({
    expression: expressionText,
    result: formattedResult
  });

  renderHistory();
  saveHistory();

  currentInput = formattedResult;

  expressionTokens = [];
  waitingForSecondOperand = false;
  justCalculated = true;

  updateDisplay();
}



// 13. Handle calculation errors

function showError() {
  currentInput = "Error";
  expressionTokens = [];

  waitingForSecondOperand = false;
  justCalculated = true;

  previousOperationDisplay.textContent =
    "Cannot divide by zero";

  updateDisplay();
}



// 14. Button click handling
buttons.forEach(function(button) {

    button.addEventListener("click", function() {

        const number = button.dataset.value;
        const action = button.dataset.action;

        // Number and operator buttons
        if (number !== undefined) {

            if (["+", "-", "*", "/"].includes(number)) {
                chooseOperator(number);

            } else if (number === ".") {
                enterDecimal();

            } else {
                enterNumber(number);
            }
        }

        // Function buttons
        if (action === "clear") {
            clearCalculator();
        }

        if (action === "delete") {
            deleteNumber();
        }

        if (action === "sign") {
            changeSign();
        }

        if (action === "calculate") {
            calculate();
        }

        if (action === "toggle-history") {
            toggleHistory();
        }

        if (action === "toggle-theme") {
            toggleTheme();
        }

        if (action === "clear-history") {
            clearHistory();
        }

    });

});


// 15. Initialize calculator
updateDisplay();


/* =================================
   STAGE 6: KEYBOARD SUPPORT
================================= */

document.addEventListener("keydown", function(event) {

    const key = event.key;

    // Number keys
    if (key >= "0" && key <= "9") {
        enterNumber(key);
    }

    // Decimal point
    else if (key === ".") {
        enterDecimal();
    }

    // Arithmetic operators
    else if (["+", "-", "*", "/"].includes(key)) {
        chooseOperator(key);
    }

    // Calculate result
    else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
    }

    // Delete last digit
    else if (key === "Backspace") {
        deleteNumber();
    }

    // Clear calculator
    else if (key === "Escape") {
        clearCalculator();
    }

    // Change sign
    else if (key === "F9") {
        changeSign();
    }

});


function renderHistory() {

    historyList.innerHTML = "";

    if (calculationHistory.length === 0) {

        historyList.innerHTML = `
            <p class="empty-history">
                No calculations yet
            </p>
        `;

        return;
    }

    calculationHistory.forEach(function(item) {

        const historyItem = document.createElement("div");
        historyItem.className = "history-item";

        const expression = document.createElement("div");
        expression.className = "history-expression";
        expression.textContent = item.expression;

        const result = document.createElement("div");
        result.className = "history-result";
        result.textContent = item.result;

        historyItem.appendChild(expression);
        historyItem.appendChild(result);

        historyList.appendChild(historyItem);

    });

}

function saveHistory() {
  localStorage.setItem(
    "calcNovaHistory",
    JSON.stringify(calculationHistory)
  );
}

function toggleHistory() {

    historyPanel.hidden = !historyPanel.hidden;

}





function applyTheme(theme) {
  document.body.classList.toggle(
    "light-theme",
    theme === "light"
  );

  localStorage.setItem("calcNovaTheme", theme);
}

function toggleTheme() {
  const isLightTheme =
    document.body.classList.contains("light-theme");

  if (isLightTheme) {
    applyTheme("dark");
  } else {
    applyTheme("light");
  }
}





function clearHistory() {
  calculationHistory = [];
  renderHistory();
  saveHistory();
}



updateDisplay();
renderHistory();

applyTheme(
  localStorage.getItem("calcNovaTheme") || "dark"
);