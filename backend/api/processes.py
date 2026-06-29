from fastapi import APIRouter
import psutil

router = APIRouter()

@router.get("/processes")
def processes():

    items = []

    for proc in psutil.process_iter(
        ["pid", "name", "cpu_percent", "memory_percent"]
    ):
        try:
            items.append(proc.info)
        except:
            pass

    items = sorted(
        items,
        key=lambda x: x["memory_percent"],
        reverse=True
    )

    return items[:20]