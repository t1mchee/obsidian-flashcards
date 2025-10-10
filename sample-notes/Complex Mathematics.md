# Complex Mathematics

This note contains complex mathematical expressions and derivations using LaTeX.

## Moving Average to Autoregressive Conversion

Write $y_t = (1 + \beta L)\varepsilon_t$

### Derivation Steps

**Starting with MA(1):**
$y_t = \varepsilon_t + \beta\varepsilon_{t-1}$

**Use lag operator L:**
$y_t = \varepsilon_t + \beta L\varepsilon_t$
$y_t = (1 + \beta L)\varepsilon_t$

**Invert to solve for $\varepsilon_t$:**
$\varepsilon_t = (1 + \beta L)^{-1}y_t$

**Expand using geometric series $(1+x)^{-1} = \sum_{i=0}^{\infty}(-x)^i$:**
$(1 + \beta L)^{-1} = \sum_{i=0}^{\infty}(-\beta L)^i$
$= 1 - \beta L + \beta^2 L^2 - \beta^3 L^3 + \cdots$

**Therefore:**
$\varepsilon_t = \sum_{i=0}^{\infty}(-\beta L)^i y_t$
$= y_t - \beta L y_t + \beta^2 L^2 y_t - \beta^3 L^3 y_t + \cdots$
$= y_t - \beta y_{t-1} + \beta^2 y_{t-2} - \beta^3 y_{t-3} + \cdots$

an AR($\infty$) model, the expansion will be valid if $|\beta| < 1$.

## Multiline Equation Test

\begin{align}
y_t &= \varepsilon_t + \rho(\varepsilon_{t-1} + \rho y_{t-2})\\
&= \varepsilon_t + \rho\varepsilon_{t-1} + \rho^2(\varepsilon_{t-2} + \rho y_{t-3})\\
&=\sum_{i=0}^{N-1} \rho^i \varepsilon_{t-i} + \rho^N y_{t-N}
\end{align}

## Maxwell's Equations

$$
\begin{align}
\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &= \frac{4\pi}{c}\vec{\mathbf{j}} \\
\nabla \cdot \vec{\mathbf{E}} &= 4 \pi \rho \\
\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} &= \vec{\mathbf{0}} \\
\nabla \cdot \vec{\mathbf{B}} &= 0
\end{align}
$$

## Remarks:

1. The MA(1) is stationary for all $\beta$.
2. For AR($\infty$) representation need $|\beta| < 1$. Processes that satisfy 2 are called **invertible**.

Notice that earlier we wrote an AR(1) process as an MA($\infty$) under the condition that the AR process was stationary.
