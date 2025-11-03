from escpos.printer import Usb
import usb.core
from datetime import datetime

class BillPrinter:
    def __init__(self):
        self.vendor_id = 0x0fe6
        self.product_id = 0x811e
        self.in_ep = 0x81
        self.out_ep = 0x01

    def setup_printer(self):
        """Setup and initialize the printer"""
        import time

        # Try to find the printer (with retry)
        max_retries = 3
        dev = None

        for i in range(max_retries):
            dev = usb.core.find(idVendor=self.vendor_id, idProduct=self.product_id)
            if dev is not None:
                break
            if i < max_retries - 1:
                print(f"Printer not found, retrying... ({i+1}/{max_retries})")
                time.sleep(1)

        if dev is None:
            raise ValueError("Printer not found! Please check:\n1. Printer is connected via USB\n2. Run 'lsusb | grep 0fe6' to verify\n3. You may need USB permissions")

        # Detach kernel driver from all interfaces
        for cfg in dev:
            for intf in cfg:
                if dev.is_kernel_driver_active(intf.bInterfaceNumber):
                    try:
                        dev.detach_kernel_driver(intf.bInterfaceNumber)
                    except usb.core.USBError:
                        pass

        # Reset and configure
        try:
            dev.reset()
            dev.set_configuration()
        except usb.core.USBError:
            pass

        # Initialize printer
        p = Usb(self.vendor_id, self.product_id, 0, in_ep=self.in_ep, out_ep=self.out_ep)
        return p

    def print_bill(self, items, table_no="1", order_id=None):
        """
        Print a simple bill with table, order, items and quantity

        Parameters:
        -----------
        items : list of dict
            Each dict should have: {'name': str, 'qty': int}
        table_no : str
            Table number
        order_id : str
            Order ID (auto-generated if not provided)
        """
        # Setup printer
        p = self.setup_printer()

        # Get current date and time
        now = datetime.now()
        date_str = now.strftime("%d-%m-%Y")
        time_str = now.strftime("%I:%M %p")

        # Auto-generate order ID if not provided
        if order_id is None:
            order_id = now.strftime("A%H%M%S")

        # ==================== ORDER INFO ====================
        p.set(align='left', bold=True)
        p.text(f"Table: {table_no}\n")
        p.text(f"Order: {order_id}\n")
        p.set(bold=False)
        p.text(f"Date: {date_str}  {time_str}\n")
        p.text("--------------------------------\n")

        # ==================== ITEMS ====================
        p.text("Item                     Qty\n")
        p.text("--------------------------------\n")

        # Print items
        for item in items:
            name = item['name']
            qty = item['qty']

            # Format item line (32 chars wide for receipt)
            name_short = name[:24].ljust(24)
            qty_str = str(qty).rjust(4)

            p.text(f"{name_short} {qty_str}\n")

        p.text("--------------------------------\n")
        p.text("\n\n")

        # Cut paper
        p.cut()
        p.close()

        print(f"✓ Bill printed!")
        print(f"  Order: {order_id}")
        print(f"  Table: {table_no}")


def print_bill(items, table_no="1", order_id=None, order_number=None):
    """
    Quick function to print a simple bill

    Parameters:
    -----------
    items : list of dict
        Each dict should have: {'name': str, 'quantity': int, 'price': float}
        Example: [{"name": "Masala Dosa", "quantity": 2, "price": 50}]
    table_no : str
        Table number
    order_id : int
        Order ID (auto-generated if not provided)
    order_number : int
        Order number in session (optional)

    Returns:
    --------
    dict
        {"success": True/False, "error": "..." (if failed), "order_id": int}
    """
    try:
        # Convert items format from 'quantity' to 'qty' for printer
        formatted_items = []
        total = 0
        for item in items:
            formatted_items.append({
                'name': item['name'],
                'qty': item.get('quantity', item.get('qty', 1))
            })
            if 'price' in item and 'quantity' in item:
                total += item['price'] * item['quantity']

        printer = BillPrinter()
        printer.print_bill(formatted_items, table_no, order_id)

        return {
            "success": True,
            "order_id": order_id,
            "total": total
        }

    except Exception as e:
        print(f"✗ Print failed: {e}")
        return {
            "success": False,
            "error": str(e)
        }
