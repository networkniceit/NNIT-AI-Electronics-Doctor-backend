# scanners/storage_health.py

import psutil

def storage_health():

    results = []

    for disk in psutil.disk_partitions():

        try:
            usage = psutil.disk_usage(disk.mountpoint)

            results.append({
                "drive": disk.device,
                "filesystem": disk.fstype,
                "used_percent": round(
                    usage.used / usage.total * 100, 2
                ),
                "free_gb": round(
                    usage.free / (1024**3), 2
                ),
                "status": "healthy"
            })

        except:
            pass

    return results