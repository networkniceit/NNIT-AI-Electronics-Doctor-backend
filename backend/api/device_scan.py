from fastapi import APIRouter

from scanners.system_scan import scan_system


router = APIRouter()


@router.get("/device-scan")
def device_scan():

    return scan_system()