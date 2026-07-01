from fastapi import APIRouter
from scanners.physical_disks import physical_disks

router = APIRouter()

@router.get("/physical-disks")
def disks():

    return physical_disks()