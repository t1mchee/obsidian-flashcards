---
tags:
  - Statistics
  - Econometrics
  - TimeSeries
---

# AR1 Autocorrelation Derivation

Multiply both sides by $y_{t-j}$ and take expectations:

$y_t = \rho y_{t-1} + \varepsilon_t$

Multiply by $y_{t-j}$ and take expectations:
$y_t y_{t-j} = \rho y_{t-1} y_{t-j} + \varepsilon_t y_{t-j}$

$E(y_t y_{t-j}) = \rho E(y_{t-1} y_{t-j}) + E(\varepsilon_t y_{t-j})$

Since $E(y_t) = 0$, we have $\gamma_j = E(y_t y_{t-j})$

For $j \geq 1$, $E(\varepsilon_t y_{t-j}) = 0$

Therefore:
$\gamma_j = \rho \gamma_{j-1}$ for $j = 1, 2, \ldots$

Solving the recursion:
$\gamma_1 = \rho \gamma_0$
$\gamma_2 = \rho \gamma_1 = \rho^2 \gamma_0$
$\gamma_3 = \rho \gamma_2 = \rho^3 \gamma_0$
$\ldots$
$\gamma_j = \rho^j \gamma_0$

Divide by $\gamma_0$ to obtain autocorrelations:
$\rho_j = \frac{\gamma_j}{\gamma_0} = \rho^j$
