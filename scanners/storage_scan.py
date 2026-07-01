import psutil

def scan_drives():

    drives = []

    for p in psutil.disk_partitions():

        try:
            usage = psutil.disk_usage(p.mountpoint)

            drives.append({
                "drive": p.device,
                "mount": p.mountpoint,
                "filesystem": p.fstype,
                "total_gb": round(usage.total/(1024**3),2),
                "used_gb": round(usage.used/(1024**3),2),
                "free_gb": round(usage.free/(1024**3),2)
            })

        except:
            pass

    return drives