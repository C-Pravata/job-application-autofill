import qrcode
import socket
import os

def get_local_ip():
    """Get the local IP address of the machine"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def generate_qr_code(url, output_path='qr_code.png'):
    """Generate a QR code for the given URL"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img.save(output_path)
    print(f"QR code saved to {output_path}")
    print(f"Scan this QR code with your iPhone to access the app at: {url}")

if __name__ == "__main__":
    local_ip = get_local_ip()
    port = 8080  # Make sure this matches the port in app.py
    url = f"http://{local_ip}:{port}"
    
    # Create the QR code
    generate_qr_code(url)
    
    # Try to open the QR code image
    try:
        if os.name == 'posix':  # macOS or Linux
            os.system(f"open qr_code.png")
        elif os.name == 'nt':  # Windows
            os.system(f"start qr_code.png")
    except:
        pass 