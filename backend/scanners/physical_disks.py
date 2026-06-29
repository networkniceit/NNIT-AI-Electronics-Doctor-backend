import subprocess

def physical_disks():

    try:

        result = subprocess.check_output(
            "wmic diskdrive get model,size,status",
            shell=True
        )

        return {
            "disks": result.decode(
                errors="ignore"
            )
        }

    except Exception as e:

        return {
            "error": str(e)
        }