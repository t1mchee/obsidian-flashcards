# Specification

$u_t = \epsilon_t + \beta_1\epsilon_{t-1} + \beta_2\epsilon_{t-2} + \dots + \beta_k\epsilon_{t-k}$

Variance:

$$\begin{align*}
\gamma_0 &= \text{Var}(u_t) \\
&= \text{Var}(\varepsilon_t + \beta_1\varepsilon_{t-1} + \cdots + \beta_k\varepsilon_{t-k}) \\
&= \sigma^2 + \beta_1^2\sigma^2 + \beta_2^2\sigma^2 + \cdots + \beta_k^2\sigma^2 \\
&= \sigma^2\sum_{j=0}^{k}\beta_j^2 \quad \text{(where } \beta_0 = 1\text{)}
\end{align*}$$

Autocovariance for $s \leq k:$

$$\begin{align*}
\gamma_s &= \text{Cov}(u_t, u_{t-s}) \\
&= \text{Cov}(\varepsilon_t + \beta_1\varepsilon_{t-1}+\cdots + \beta_k\varepsilon_{t-k}, \varepsilon_{t-s} + \beta_1\varepsilon_{t-s-1}+\cdots + \beta_k\varepsilon_{t-s-k})
\end{align*}$$

Only terms with common $\varepsilon$ shocks contribute:

$$\begin{align*}
\gamma_s &= \text{Cov}(\beta_s\varepsilon_{t-s} + \beta_{s+1}\varepsilon_{t-s-1}+\cdots + \beta_k\varepsilon_{t-k},\varepsilon_{t-s} + \beta_1\varepsilon_{t-s-1}+\cdots + \beta_{k-s}\varepsilon_{t-k}) \\
&= \beta_s\sigma^2 + \beta_{s+1}\beta_1\sigma^2 + \beta_{s+2}\beta_2\sigma^2 + \cdots + \beta_k\beta_{k-s}\sigma^2 \\
&= \sigma^2\sum_{j=0}^{k-s}\beta_j\beta_{j+s}
\end{align*}$$

Finding autocorrelation

$$\begin{align*}
\rho_s &= \frac{\gamma_s}{\gamma_0} \\
&= \frac{\sigma^2\sum_{j=0}^{k-s}\beta_j\beta_{j+s}}{\sigma^2\sum_{j=0}^{k}\beta_j^2} \\
&= \frac{\sum_{j=0}^{k-s}\beta_j\beta_{j+s}}{\sum_{j=0}^{k}\beta_j^2} \quad \text{for } s \leq k
\end{align*}$$

For $s > k:$

$$\begin{align*}
\gamma_s &= \text{Cov}(u_t, u_{t-s}) = 0 \quad \text{(no common shocks)} \\
\rho_s &= 0 \quad \text{otherwise}
\end{align*}$$

so the model is stationary $\forall \beta_1, \beta_2, \ldots, \beta_k$.
