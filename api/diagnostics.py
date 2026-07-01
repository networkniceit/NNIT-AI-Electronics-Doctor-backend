from fastapi import APIRouter

from repair_tools.diagnostics import diagnose_system


router = APIRouter()


@router.get("/diagnostics")
def diagnostics():

    return diagnose_system()