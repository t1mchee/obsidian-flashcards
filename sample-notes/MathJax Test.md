# MathJax Test

This tests the new MathJax implementation like Obsidian uses.

Inline math: $E(\varepsilon_t) = 0$ and $E(\varepsilon_t^2) = \sigma^2$

Display math with align environment:

$$
\begin{align}
y_t &= \varepsilon_t + \rho(\varepsilon_{t-1} + \rho y_{t-2})\\
&= \varepsilon_t + \rho\varepsilon_{t-1} + \rho^2(\varepsilon_{t-2} + \rho y_{t-3})\\
&=\sum_{i=0}^{N-1} \rho^i \varepsilon_{t-i} + \rho^N y_{t-N}
\end{align}
$$

Another equation:

$$
\begin{align*}
\gamma_0 &= \text{Var}(u_t) \\
&= \sigma^2 + \beta_1^2\sigma^2 + \beta_2^2\sigma^2 \\
&= \sigma^2\sum_{j=0}^{k}\beta_j^2
\end{align*}
$$

And some regular text with **bold** and *italic* formatting.
