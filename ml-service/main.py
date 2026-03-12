"""
StockGenie ML Service
FastAPI-based forecasting service using Prophet + scikit-learn

Run:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import json

app = FastAPI(title="StockGenie ML Service", version="1.0.0")


# ── Models ────────────────────────────────────────────────────────────────────

class SalesDataPoint(BaseModel):
    date: str  # ISO date string
    quantity: float


class ForecastRequest(BaseModel):
    product_id: str
    product_name: str
    category: str
    historical_data: List[SalesDataPoint]
    forecast_days: int = 30
    location: Optional[str] = None
    season: Optional[str] = None


class ForecastPoint(BaseModel):
    date: str
    predicted_quantity: float
    lower_bound: float
    upper_bound: float


class ForecastResponse(BaseModel):
    product_id: str
    product_name: str
    predictions: List[ForecastPoint]
    confidence: float
    trend: str  # "increasing" | "stable" | "decreasing"
    seasonal_factors: List[str]


class DemandSummaryRequest(BaseModel):
    products: List[dict]
    season: str
    location: Optional[str] = None
    forecast_days: int = 30


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "StockGenie ML Service"}


@app.post("/forecast/product", response_model=ForecastResponse)
def forecast_product(req: ForecastRequest):
    """
    Generate demand forecast for a single product using Prophet or simple moving average.
    """
    if len(req.historical_data) < 7:
        # Not enough data — use a simple trend-based estimate
        avg = sum(d.quantity for d in req.historical_data) / max(len(req.historical_data), 1)
        predictions = []
        base_date = datetime.now()
        for i in range(req.forecast_days):
            forecast_date = base_date + timedelta(days=i)
            predictions.append(ForecastPoint(
                date=forecast_date.strftime("%Y-%m-%d"),
                predicted_quantity=round(avg, 2),
                lower_bound=round(avg * 0.8, 2),
                upper_bound=round(avg * 1.2, 2),
            ))
        return ForecastResponse(
            product_id=req.product_id,
            product_name=req.product_name,
            predictions=predictions,
            confidence=0.5,
            trend="stable",
            seasonal_factors=["Insufficient data for seasonal analysis"],
        )

    try:
        from prophet import Prophet
        import pandas as pd

        df = pd.DataFrame([
            {"ds": d.date, "y": d.quantity}
            for d in req.historical_data
        ])
        df["ds"] = pd.to_datetime(df["ds"])

        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            uncertainty_samples=100,
        )
        model.fit(df)

        future = model.make_future_dataframe(periods=req.forecast_days)
        forecast = model.predict(future)

        recent = forecast.tail(req.forecast_days)
        predictions = []
        for _, row in recent.iterrows():
            predictions.append(ForecastPoint(
                date=row["ds"].strftime("%Y-%m-%d"),
                predicted_quantity=max(0, round(row["yhat"], 2)),
                lower_bound=max(0, round(row["yhat_lower"], 2)),
                upper_bound=max(0, round(row["yhat_upper"], 2)),
            ))

        # Determine trend
        first_half_avg = forecast.head(len(req.historical_data) // 2)["yhat"].mean()
        last_half_avg = forecast.tail(req.forecast_days)["yhat"].mean()
        if last_half_avg > first_half_avg * 1.1:
            trend = "increasing"
        elif last_half_avg < first_half_avg * 0.9:
            trend = "decreasing"
        else:
            trend = "stable"

        return ForecastResponse(
            product_id=req.product_id,
            product_name=req.product_name,
            predictions=predictions,
            confidence=0.82,
            trend=trend,
            seasonal_factors=_get_seasonal_factors(req.season, req.category),
        )

    except ImportError:
        # Prophet not installed — fallback to moving average
        quantities = [d.quantity for d in req.historical_data]
        window = min(7, len(quantities))
        avg = sum(quantities[-window:]) / window

        predictions = []
        base_date = datetime.now()
        for i in range(req.forecast_days):
            forecast_date = base_date + timedelta(days=i)
            predictions.append(ForecastPoint(
                date=forecast_date.strftime("%Y-%m-%d"),
                predicted_quantity=round(avg, 2),
                lower_bound=round(avg * 0.8, 2),
                upper_bound=round(avg * 1.2, 2),
            ))

        return ForecastResponse(
            product_id=req.product_id,
            product_name=req.product_name,
            predictions=predictions,
            confidence=0.6,
            trend="stable",
            seasonal_factors=_get_seasonal_factors(req.season, req.category),
        )


@app.post("/forecast/demand-summary")
def demand_summary(req: DemandSummaryRequest):
    """
    Generate a demand summary for multiple products.
    Returns suggested order quantities.
    """
    results = []
    for product in req.products:
        avg_daily = product.get("avgDailySales", 0)
        current_stock = product.get("currentStock", 0)
        reorder_level = product.get("reorderLevel", 10)
        category = product.get("category", "")

        seasonal_multiplier = _get_seasonal_multiplier(req.season, category)
        predicted_demand = avg_daily * req.forecast_days * seasonal_multiplier
        suggested_order = max(0, predicted_demand - current_stock)

        results.append({
            "productId": product.get("productId"),
            "productName": product.get("productName"),
            "currentStock": current_stock,
            "predictedDemand": round(predicted_demand, 1),
            "suggestedOrder": round(suggested_order, 1),
            "seasonalMultiplier": seasonal_multiplier,
        })

    return {
        "season": req.season,
        "location": req.location,
        "forecastDays": req.forecast_days,
        "products": results,
        "confidence": 0.75,
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_seasonal_multiplier(season: Optional[str], category: str) -> float:
    if not season:
        return 1.0

    season_lower = season.lower()
    category_lower = category.lower()

    multipliers = {
        "diwali": {"sweets": 3.0, "snacks": 2.5, "gifts": 2.0, "default": 1.8},
        "holi": {"colours": 4.0, "sweets": 2.0, "beverages": 1.5, "default": 1.5},
        "eid": {"spices": 2.5, "sweets": 2.0, "default": 1.8},
        "summer": {"beverages": 2.0, "cold": 2.5, "default": 1.3},
        "monsoon": {"umbrella": 3.0, "medicines": 1.5, "default": 1.2},
        "winter": {"woollens": 2.5, "hot": 1.8, "default": 1.3},
    }

    for season_key, cats in multipliers.items():
        if season_key in season_lower:
            for cat_key, mult in cats.items():
                if cat_key != "default" and cat_key in category_lower:
                    return mult
            return cats.get("default", 1.0)

    return 1.0


def _get_seasonal_factors(season: Optional[str], category: str) -> List[str]:
    factors = []
    if season:
        factors.append(f"Season: {season}")
    if category:
        factors.append(f"Category: {category}")
    return factors or ["General demand pattern"]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
