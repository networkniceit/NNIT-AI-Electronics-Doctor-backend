from fastapi import APIRouter
from repair_tools.diagnostics import diagnose_system

router = APIRouter()

@router.get("/ai-diagnosis")
def ai_diagnosis():

    result = diagnose_system()

    recommendations = []

    if result["ram_usage"] > 85:
        recommendations.extend([
            "Close unnecessary programs",
            "Check startup applications",
            "Restart the computer",
            "Investigate memory-hungry processes"
        ])

    if result["cpu_usage"] > 90:
        recommendations.extend([
            "Check background tasks",
            "Run malware scan",
            "Review CPU intensive applications"
        ])

    if not recommendations:
        recommendations.append(
            "System appears healthy"
        )

    return {
        "analysis": result,
        "recommendations": recommendations
    }