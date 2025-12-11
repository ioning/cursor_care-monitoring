# Vision: AI Scenarios

- Поток: Telemetry Service публикует `TelemetryReceived` → AI Prediction Service (эвристика/модель) → `PredictionGenerated` / `RiskAlert` → Alert/Integration → уведомления.
- Метрики: HR, HRV, accel, steps, SpO2*. Простейшие правила порогов + дельта HR.
- Деградация: при недоступном AI fallback на пороговые правила.
- События: `TelemetryReceived`, `PredictionGenerated`, `AnomalyDetected`, `RiskAlert`, `ModelTrained`, `ModelDeployed`.
- Цель задержки: p95 ≤ 120 мс для инференса.

