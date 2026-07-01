from fastapi import APIRouter
from scanners.storage_scan import scan_drives

router = APIRouter()

@router.get("/storage")
def storage():

    return scan_drives()