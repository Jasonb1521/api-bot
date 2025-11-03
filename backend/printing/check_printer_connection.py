#!/usr/bin/env python3
"""
Diagnostic script to check printer connection and permissions
"""

import usb.core
import sys

print("="*50)
print("Printer Connection Diagnostic")
print("="*50)

# Check if printer is visible
print("\n1. Checking for printer (0fe6:811e)...")
dev = usb.core.find(idVendor=0x0fe6, idProduct=0x811e)

if dev is None:
    print("   ❌ Printer NOT found!")
    print("\n   Please check:")
    print("   - Is the printer connected via USB?")
    print("   - Run: lsusb | grep 0fe6")
    print("   - Try unplugging and replugging the printer")
    sys.exit(1)
else:
    print("   ✓ Printer found!")
    print(f"   Device: {dev}")

# Check if we can access it
print("\n2. Checking USB permissions...")
try:
    # Try to get device information
    manufacturer = None
    product = None

    try:
        manufacturer = usb.util.get_string(dev, dev.iManufacturer) if dev.iManufacturer else "N/A"
    except:
        pass

    try:
        product = usb.util.get_string(dev, dev.iProduct) if dev.iProduct else "N/A"
    except:
        pass

    print(f"   ✓ Can access device")
    if manufacturer or product:
        print(f"   Manufacturer: {manufacturer}")
        print(f"   Product: {product}")

except usb.core.USBError as e:
    print(f"   ⚠️  Permission issue: {e}")
    print("\n   You may need to:")
    print("   - Run with sudo: sudo python3 test_print.py")
    print("   - Or add USB udev rules for your user")

# Check kernel driver
print("\n3. Checking kernel driver...")
try:
    if dev.is_kernel_driver_active(0):
        print("   ⚠️  Kernel driver is active (will be detached when printing)")
    else:
        print("   ✓ No kernel driver attached")
except:
    print("   ⚠️  Cannot check kernel driver status")

print("\n" + "="*50)
print("Diagnosis Complete!")
print("="*50)
print("\nIf all checks passed, try running:")
print("  python3 test_print.py")
print("\nIf you see permission issues, try:")
print("  sudo python3 test_print.py")
print("="*50)
