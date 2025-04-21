import requests
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_url(url, name, timeout=10):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=timeout)
        status = response.status_code
        logger.info(f"{name}: Status {status} - {'OK' if status == 200 else 'Failed'}")
        return status == 200
    except Exception as e:
        logger.error(f"{name} Error: {str(e)}")
        return False

def main():
    print(f"\n🩺 Testing Active Health RSS/API Endpoints - {datetime.now()}\n")

    apis = {
        "MedlinePlus": "https://connect.medlineplus.gov/service",
        "WHO Feed": "https://www.who.int/news",
        "CDC Feed": "https://www.cdc.gov/rss/whatsnew.xml",
        "NIH Feed": "https://directorsblog.nih.gov/feed/",
        "PubMed Example": "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=health"
    }

    print("Testing each API/RSS feed...\n")
    for name, url in apis.items():
        test_url(url, name, timeout=30)
        print()

    print("\n🔐 API Usage Info:\n")
    print("📘 PubMed:")
    print("   - Requires an API key for more than 3 requests/sec")
    print("   - Get your key here: https://www.ncbi.nlm.nih.gov/account/\n")

    print("📰 Others (WHO, CDC, NIH, MedlinePlus):")
    print("   - Free and open RSS/API access")
    print("   - No API key required")
    print("   - Use a custom User-Agent to avoid request blocks")

    print("\n⚠️ If a feed fails:")
    print("   - Check if the feed URL has changed on the official website")
    print("   - Make sure you're not rate-limited")
    print("   - Try again with proper headers and timeout")

if __name__ == "__main__":
    main()

# This is a development script to test RSS/API availability for health content.
