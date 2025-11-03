"""
Printing module for Hotel-Bot

Simple bill printing with:
- Table Number
- Order Number
- Date & Time
- Items & Quantities
"""

from .print_bill import print_bill, BillPrinter

__all__ = ['print_bill', 'BillPrinter']
