"""
Quick Test Script for Bill Printing

Simple bill format with only:
- Table Number
- Order Number
- Date & Time (auto-generated)
- Item Name & Quantity

To print a bill:
1. Modify the 'items' list below with your food items
2. Run: python3 test_print.py
"""

from print_bill import print_bill

# =============================================
# ADD YOUR ITEMS HERE
# =============================================
# Format: {"name": "Item Name", "qty": quantity}

items = [
    {"name": "Masala Dosa", "qty": 2},
    {"name": "Idli Sambar", "qty": 1},
    {"name": "Vada", "qty": 3},
    {"name": "Filter Coffee", "qty": 2},
    {"name": "Pongal", "qty": 1},
    {"name": "Rava Dosa", "qty": 1},
]

# Table number and Order ID (optional)
table_number = "12"
order_id = "A5678"  # Set to None for auto-generation

# =============================================
# PRINT THE BILL
# =============================================
print("\n🖨️  Printing bill...")
print_bill(items, table_no=table_number, order_id=order_id)
