import sys
import os
import json
import argparse
from pathlib import Path
from pdf2docx import Converter


def convert_pdf_to_docx(input_path, output_path, pages=None, start_page=0, end_page=None):
    """
    Convert PDF to DOCX using pdf2docx library
    
    Args:
        input_path (str): Path to input PDF file
        output_path (str): Path for output DOCX file
        pages (list): Specific pages to convert (None for all)
        start_page (int): Start page (0-indexed)
        end_page (int): End page (None for all remaining)
    
    Returns:
        dict: Conversion result with statistics
    """
    try:
        if not os.path.exists(input_path):
            return {
                "success": False,
                "error": f"Input file not found: {input_path}",
                "code": "FILE_NOT_FOUND"
            }
        
        # Ensure output directory exists
        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        
        # Initialize converter
        cv = Converter(input_path)
        
        # Perform conversion
        if pages:
            cv.convert(output_path, pages=pages)
        elif start_page is not None or end_page is not None:
            cv.convert(output_path, start=start_page, end=end_page)
        else:
            cv.convert(output_path)
        
        # Close converter
        cv.close()
        
        # Get file statistics
        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            
            try:
                import PyPDF2
                with open(input_path, 'rb') as pdf_file:
                    pdf_reader = PyPDF2.PdfReader(pdf_file)
                    total_pages = len(pdf_reader.pages)
            except:
                total_pages = "Unknown"
            
            return {
                "success": True,
                "output_path": output_path,
                "file_size": file_size,
                "method": "pdf2docx library conversion",
                "statistics": {
                    "total_pages": total_pages,
                    "converted_pages": len(pages) if pages else (end_page - start_page if start_page is not None and end_page is not None else total_pages),
                    "format": "High-quality PDF to DOCX conversion",
                    "preserves": ["formatting", "tables", "images", "text structure"]
                }
            }
        else:
            return {
                "success": False,
                "error": "Output file was not created",
                "code": "CONVERSION_FAILED"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "code": "CONVERSION_ERROR"
        }

def main():
    parser = argparse.ArgumentParser(description='Convert PDF to DOCX using pdf2docx')
    parser.add_argument('input', help='Input PDF file path')
    parser.add_argument('output', help='Output DOCX file path')
    parser.add_argument('--pages', help='Specific pages to convert (comma-separated)', default=None)
    parser.add_argument('--start', type=int, help='Start page (0-indexed)', default=0)
    parser.add_argument('--end', type=int, help='End page', default=None)
    parser.add_argument('--json', action='store_true', help='Output result as JSON')
    
    args = parser.parse_args()
    
    # Parse pages if provided
    pages = None
    if args.pages:
        try:
            pages = [int(p.strip()) for p in args.pages.split(',')]
        except ValueError:
            if args.json:
                print(json.dumps({
                    "success": False,
                    "error": "Invalid pages format. Use comma-separated numbers.",
                    "code": "INVALID_PAGES"
                }))
            else:
                print("Error: Invalid pages format. Use comma-separated numbers.")
            sys.exit(1)
    
    # Perform conversion
    result = convert_pdf_to_docx(
        args.input, 
        args.output, 
        pages=pages,
        start_page=args.start,
        end_page=args.end
    )
    
    # Output result
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        if result["success"]:
            print(f"✅ Conversion successful!")
            print(f"📄 Output: {result['output_path']}")
            print(f"📊 File size: {result['file_size']} bytes")
            print(f"🔧 Method: {result['method']}")
            if 'statistics' in result:
                stats = result['statistics']
                print(f"📖 Pages: {stats.get('converted_pages', 'Unknown')}")
                print(f"✨ Preserves: {', '.join(stats.get('preserves', []))}")
        else:
            print(f"❌ Conversion failed: {result['error']}")
            sys.exit(1)

if __name__ == "__main__":
    main() 