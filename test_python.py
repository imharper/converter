import sys
import json

def test_imports():
    result = {
        "python_version": sys.version,
        "imports": {}
    }
    
    # Тестируем импорты
    try:
        import pdf2docx
        result["imports"]["pdf2docx"] = "OK"
        result["imports"]["pdf2docx_version"] = getattr(pdf2docx, '__version__', 'unknown')
    except Exception as e:
        result["imports"]["pdf2docx"] = f"FAILED: {e}"
    
    try:
        import PyPDF2
        result["imports"]["PyPDF2"] = "OK"
        result["imports"]["PyPDF2_version"] = getattr(PyPDF2, '__version__', 'unknown')
    except Exception as e:
        result["imports"]["PyPDF2"] = f"FAILED: {e}"
    
    try:
        import docx
        result["imports"]["python-docx"] = "OK"
    except Exception as e:
        result["imports"]["python-docx"] = f"FAILED: {e}"
    
    return result

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--json":
        result = test_imports()
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        result = test_imports()
        print("🐍 Python Test Results:")
        print(f"Python: {result['python_version']}")
        print("\nImports:")
        for package, status in result['imports'].items():
            if "FAILED" in status:
                print(f"❌ {package}: {status}")
            else:
                print(f"✅ {package}: {status}") 