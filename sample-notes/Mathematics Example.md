# Mathematics Example

This note contains various mathematical formulas and equations using LaTeX notation.

## Inline Math

Here are some inline mathematical expressions:

The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$.

The derivative of $f(x) = x^2$ is $f'(x) = 2x$.

## Display Math

Here are some displayed mathematical equations:

$$
E = mc^2
$$

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

$$
\begin{align}
\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &= \frac{4\pi}{c}\vec{\mathbf{j}} \\
\nabla \cdot \vec{\mathbf{E}} &= 4 \pi \rho \\
\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} &= \vec{\mathbf{0}} \\
\nabla \cdot \vec{\mathbf{B}} &= 0
\end{align}
$$

## Test Align Environment (should work now)

\begin{align}
y_t &= \varepsilon_t + \rho(\varepsilon_{t-1} + \rho y_{t-2})\\
&= \varepsilon_t + \rho\varepsilon_{t-1} + \rho^2(\varepsilon_{t-2} + \rho y_{t-3})\\
&=\sum_{i=0}^{N-1} \rho^i \varepsilon_{t-i} + \rho^N y_{t-N}
\end{align}

## Matrix Example

$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
\begin{pmatrix}
x \\
y
\end{pmatrix}
=
\begin{pmatrix}
ax + by \\
cx + dy
\end{pmatrix}
$$

## Greek Letters and Symbols

Common Greek letters: $\alpha, \beta, \gamma, \delta, \epsilon, \theta, \lambda, \mu, \pi, \sigma, \tau, \phi, \psi, \omega$

Summation: $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$

Limits: $\lim_{x \to \infty} \frac{1}{x} = 0$
