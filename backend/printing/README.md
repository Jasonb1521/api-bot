# Printing Module

This folder contains all bill printing functionality for the Hotel-Bot.

## Files

- **`print_bill.py`** - Main printing module with BillPrinter class
- **`test_print.py`** - Quick test script (edit items and run)
- **`examples.py`** - Interactive examples with pre-made orders
- **`check_printer_connection.py`** - Diagnostic tool to check printer
- **`BILL_PRINTING_GUIDE.md`** - Complete documentation
- **`BILL_EXAMPLE.txt`** - Example of printed bill format

## Quick Start

From this folder:
```bash
python3 test_print.py
```

From main project folder:
```bash
python3 test_printer.py
```

Or run examples:
```bash
cd printing
python3 examples.py
```

## Usage in Code

```python
from printing.print_bill import print_bill

items = [
    {"name": "Masala Dosa", "qty": 2},
    {"name": "Filter Coffee", "qty": 1},
]

print_bill(items, table_no="5", order_id="A123")
```

## Troubleshooting

Check printer connection:
```bash
cd printing
python3 check_printer_connection.py
```

If printer not found:
- Check USB connection: `lsusb | grep 0fe6`
- Try with sudo: `sudo python3 test_print.py`
