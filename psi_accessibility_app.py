import streamlit as st
import pandas as pd
import requests
import os
import time
import json # To help parse potential error messages
import altair as st_alt # For better visualizations

# --- Configuration ---
API_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
API_CALL_DELAY = 0.8 # Slightly increased delay might be needed for larger responses
REQUEST_TIMEOUT = 120 # Increased timeout as getting all audits might take longer
OPENROUTER_TIMEOUT = 30 # Timeout for OpenRouter API calls

# --- Helper Functions ---
def get_audit_category(score, display_mode):
    """
    Categorizes audits into clear groups for better understanding.
    
    Args:
        score: The audit score (0, 1, or None)
        display_mode: The display mode (binary, manual, informative, notApplicable)
        
    Returns:
        str: Category name ('failed', 'manual_check', 'passed', 'not_applicable')
    """
    if score == 0 and display_mode == 'binary':
        return "failed"
    elif display_mode in ['manual', 'informative']:
        return "manual_check"
    elif score == 1 and display_mode == 'binary':
        return "passed"
    elif display_mode == 'notApplicable':
        return "not_applicable"
    else:
        return "other"

# --- Helper Function to Get Core Web Vitals ---
def get_core_web_vitals(url_to_check, api_key, strategy):
    """
    Fetches Core Web Vitals metrics from PageSpeed Insights API.
    
    Args:
        url_to_check (str): The URL to analyze.
        api_key (str): Your Google PageSpeed Insights API key.
        strategy (str): 'mobile' or 'desktop'.
    
    Returns:
        dict: Core Web Vitals metrics or error structure {'error': str}.
    """
    # Basic URL validation and cleanup
    if not url_to_check or not isinstance(url_to_check, str) or not url_to_check.strip():
        return {"error": "Invalid URL provided"}
    url_to_check = url_to_check.strip()
    if not url_to_check.startswith(('http://', 'https://')):
        url_to_check = 'https://' + url_to_check

    params = {
        'url': url_to_check,
        'key': api_key,
        'category': 'PERFORMANCE',  # Core Web Vitals are part of performance
        'strategy': strategy
    }

    try:
        response = requests.get(API_ENDPOINT, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        result = response.json()

        lighthouse_result = result.get('lighthouseResult')
        if not lighthouse_result:
            error_message = result.get('error', {}).get('message', 'No lighthouseResult in API response.')
            return {"error": f"API Error: {error_message}"}

        # Extract Core Web Vitals metrics
        audits = lighthouse_result.get('audits', {})
        
        # Core Web Vitals metrics
        vitals = {
            'lcp': {
                'name': 'Largest Contentful Paint (LCP)',
                'value': audits.get('largest-contentful-paint', {}).get('displayValue', 'N/A'),
                'score': audits.get('largest-contentful-paint', {}).get('score', 0),
                'numericValue': audits.get('largest-contentful-paint', {}).get('numericValue', 0),
                'description': 'Measures loading performance. To provide a good user experience, LCP should occur within 2.5 seconds.'
            },
            'fid': {
                'name': 'First Input Delay (FID)',
                'value': audits.get('max-potential-fid', {}).get('displayValue', 'N/A'),
                'score': audits.get('max-potential-fid', {}).get('score', 0),
                'numericValue': audits.get('max-potential-fid', {}).get('numericValue', 0),
                'description': 'Measures interactivity. To provide a good user experience, pages should have a FID of 100 milliseconds or less.'
            },
            'cls': {
                'name': 'Cumulative Layout Shift (CLS)',
                'value': audits.get('cumulative-layout-shift', {}).get('displayValue', 'N/A'),
                'score': audits.get('cumulative-layout-shift', {}).get('score', 0),
                'numericValue': audits.get('cumulative-layout-shift', {}).get('numericValue', 0),
                'description': 'Measures visual stability. To provide a good user experience, pages should maintain a CLS of 0.1 or less.'
            },
            'inp': {
                'name': 'Interaction to Next Paint (INP)',
                'value': audits.get('interaction-to-next-paint', {}).get('displayValue', 'N/A'),
                'score': audits.get('interaction-to-next-paint', {}).get('score', 0),
                'numericValue': audits.get('interaction-to-next-paint', {}).get('numericValue', 0),
                'description': 'Measures responsiveness. A good INP score is 200 milliseconds or less.'
            }
        }
        
        # Additional performance metrics
        additional_metrics = {
            'fcp': {
                'name': 'First Contentful Paint (FCP)',
                'value': audits.get('first-contentful-paint', {}).get('displayValue', 'N/A'),
                'score': audits.get('first-contentful-paint', {}).get('score', 0),
                'numericValue': audits.get('first-contentful-paint', {}).get('numericValue', 0)
            },
            'si': {
                'name': 'Speed Index',
                'value': audits.get('speed-index', {}).get('displayValue', 'N/A'),
                'score': audits.get('speed-index', {}).get('score', 0),
                'numericValue': audits.get('speed-index', {}).get('numericValue', 0)
            },
            'tti': {
                'name': 'Time to Interactive (TTI)',
                'value': audits.get('interactive', {}).get('displayValue', 'N/A'),
                'score': audits.get('interactive', {}).get('score', 0),
                'numericValue': audits.get('interactive', {}).get('numericValue', 0)
            },
            'tbt': {
                'name': 'Total Blocking Time (TBT)',
                'value': audits.get('total-blocking-time', {}).get('displayValue', 'N/A'),
                'score': audits.get('total-blocking-time', {}).get('score', 0),
                'numericValue': audits.get('total-blocking-time', {}).get('numericValue', 0)
            }
        }
        
        # Get performance score
        performance_score = lighthouse_result.get('categories', {}).get('performance', {}).get('score')
        if performance_score is not None:
            performance_score = int(performance_score * 100)
        else:
            performance_score = 'N/A'
        
        return {
            'performance_score': performance_score,
            'core_web_vitals': vitals,
            'additional_metrics': additional_metrics
        }

    except requests.exceptions.Timeout:
        return {"error": "Error: Timeout"}
    except requests.exceptions.HTTPError as e:
        error_detail = f"HTTP Error {e.response.status_code}"
        try:
            error_content = response.json().get('error', {})
            error_detail = f"API Error {error_content.get('code', e.response.status_code)}: {error_content.get('message', 'No details provided')}"
        except (json.JSONDecodeError, AttributeError):
            error_detail = f"HTTP Error {e.response.status_code}: {response.text[:200]}"
        return {"error": error_detail}
    except requests.exceptions.RequestException as e:
        return {"error": f"Error: Network Issue ({e})"}
    except Exception as e:
        return {"error": f"Error: Unexpected ({e})"}

# --- Helper Function to Call PageSpeed Insights API ---
# Returns detailed audit results along with the score for all categories
def get_psi_accessibility_details(url_to_check, api_key, strategy):
    """
    Fetches the PageSpeed Insights accessibility score and detailed audit results
    for a given URL using the specified strategy.

    Args:
        url_to_check (str): The URL to analyze.
        api_key (str): Your Google PageSpeed Insights API key.
        strategy (str): 'mobile' or 'desktop'.

    Returns:
        dict: A dictionary containing 'score' (str) and 'audits' (list of dicts),
              or an error structure {'error': str}.
    """
    # Basic URL validation and cleanup
    if not url_to_check or not isinstance(url_to_check, str) or not url_to_check.strip():
        return {"error": "Invalid URL provided"}
    url_to_check = url_to_check.strip()
    if not url_to_check.startswith(('http://', 'https://')):
        url_to_check = 'https://' + url_to_check

    params = {
        'url': url_to_check,
        'key': api_key,
        'category': 'ACCESSIBILITY',
        'strategy': strategy
    }

    try:
        response = requests.get(API_ENDPOINT, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        result = response.json()

        lighthouse_result = result.get('lighthouseResult')
        if not lighthouse_result:
             error_message = result.get('error', {}).get('message', 'No lighthouseResult in API response.')
             st.warning(f"Could not get lighthouseResult for {url_to_check}. API Message: {error_message}")
             return {"error": f"API Error: {error_message}"}


        # --- Extract Score ---
        accessibility_category = lighthouse_result.get('categories', {}).get('accessibility', {})
        score_raw = accessibility_category.get('score')
        score_display = "N/A"
        if score_raw is not None:
            score_display = f"{int(score_raw * 100)}%"

        # --- Extract Detailed Audits ---
        all_audits_dict = lighthouse_result.get('audits', {})
        accessibility_audit_refs = accessibility_category.get('auditRefs', [])

        detailed_audits = []
        for ref in accessibility_audit_refs:
            audit_id = ref.get('id')
            audit_data = all_audits_dict.get(audit_id)
            if not audit_data:
                continue # Skip if audit data not found

            # Get all audits, not just failures
            score = audit_data.get('score')
            display_mode = audit_data.get('scoreDisplayMode')
            
            # Extract details and snippet for all audits
            details = audit_data.get('details', {})
            snippet = ""
            items = details.get('items', [])
            if items and isinstance(items, list) and len(items) > 0:
                first_item = items[0]
                if isinstance(first_item, dict):
                    snippet = first_item.get('node', {}).get('snippet') or first_item.get('snippet', '')
            
            # Categorize the audit
            category = get_audit_category(score, display_mode)
            
            # Add all audits to the list with category information
            detailed_audits.append({
                'id': audit_id,
                'title': audit_data.get('title', 'N/A'),
                'description': audit_data.get('description', 'N/A'),
                'score': score,
                'displayMode': display_mode,
                'category': category,
                'details_snippet': snippet if snippet else " (No specific item snippet)"
            })

        return {'score': score_display, 'audits': detailed_audits}

    except requests.exceptions.Timeout:
        st.warning(f"Request timed out ({REQUEST_TIMEOUT}s) for {url_to_check}")
        return {"error": "Error: Timeout"}
    except requests.exceptions.HTTPError as e:
         error_detail = f"HTTP Error {e.response.status_code}"
         try:
             error_content = response.json().get('error', {})
             error_detail = f"API Error {error_content.get('code', e.response.status_code)}: {error_content.get('message', 'No details provided')}"
         except (json.JSONDecodeError, AttributeError): # Handle non-JSON or unexpected structure
              error_detail = f"HTTP Error {e.response.status_code}: {response.text[:200]}" # Show part of the raw response
         st.warning(f"Failed for {url_to_check}: {error_detail}")
         return {"error": error_detail}
    except requests.exceptions.RequestException as e:
        st.warning(f"Network error for {url_to_check}: {e}")
        return {"error": f"Error: Network Issue ({e})"}
    except (KeyError, AttributeError) as e: # Catch issues navigating the JSON response
         st.warning(f"Unexpected API response structure for {url_to_check}. Check response format. Error: {e}")
         # Optionally log the full response here for debugging if needed
         return {"error": f"Error: Unexpected API Response Structure ({e})"}
    except Exception as e: # Catch any other unexpected errors
        st.error(f"An unexpected error occurred processing {url_to_check}: {e}")
        return {"error": f"Error: Unexpected ({e})"}

# --- Function to Call OpenRouter API for Gemini Analysis ---
def get_gemini_analysis(failed_audits, url):
    """
    Send failed accessibility audits to Gemini 2.5 Pro via OpenRouter for analysis.
    
    Args:
        failed_audits (list): List of failed accessibility audits
        url (str): The URL that was analyzed
        
    Returns:
        str: Gemini's analysis and recommendations, or error message
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return "Error: OPENROUTER_API_KEY environment variable not found."
    
    # Format the prompt with all audit information
    prompt = f"""Analyze these accessibility failures for {url} and provide a concise summary with grading.

Your response should:
1. Grade each failure using this system:
   - **F!** (Critical): If the failure would prevent a person with disabilities from receiving information from the webpage - mark as crucial fix that needs immediate attention
   - **F+** (Standard): If the failure doesn't prevent information access but is still a failure that should be fixed

2. For each issue, provide:
   - The assigned grade (F! or F+) with clear reasoning
   - Explanation in plain, non-technical language
   - Brief, specific recommendations on how to fix the issue

3. Structure your response with:
   - Critical issues (F!) listed first
   - Standard issues (F+) listed after
   - Clear grade indicators for each issue
   - Concise explanations without unnecessary technical jargon

4. At the end, provide a brief summary of the total count of F! vs F+ issues

Here are the accessibility failures to analyze:

"""
    
    for i, audit in enumerate(failed_audits, 1):
        prompt += f"{i}. Issue: {audit.get('title')}\n"
        prompt += f"   Description: {audit.get('description')}\n"
        if audit.get('details_snippet') and audit.get('details_snippet') != " (No specific item snippet)":
            prompt += f"   Code Snippet: {audit.get('details_snippet')}\n"
        prompt += "\n"
    
    # Prepare the request to OpenRouter
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "google/gemini-2.5-pro-preview-03-25",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 4096,
        "temperature": 0.2
    }
    
    try:
        response = requests.post(
            OPENROUTER_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=OPENROUTER_TIMEOUT
        )
        response.raise_for_status()
        result = response.json()
        
        # Extract the analysis from the response
        analysis = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        if not analysis:
            return "Error: Received empty response from Gemini model."
        
        return analysis
    
    except requests.exceptions.Timeout:
        return "Error: Request to OpenRouter timed out."
    except requests.exceptions.HTTPError as e:
        error_detail = f"HTTP Error {e.response.status_code}"
        try:
            error_content = response.json().get('error', {})
            error_detail = f"API Error {error_content.get('code', e.response.status_code)}: {error_content.get('message', 'No details provided')}"
        except (json.JSONDecodeError, AttributeError):
            error_detail = f"HTTP Error {e.response.status_code}: {response.text[:200]}"
        return f"Error: {error_detail}"
    except requests.exceptions.RequestException as e:
        return f"Error: Network error occurred: {e}"
    except Exception as e:
        return f"Error: Unexpected error occurred: {e}"

# --- Streamlit App UI ---
st.set_page_config(page_title="Detailed PSI Accessibility Test", layout="wide")
st.title("PageSpeed Insights Accessibility Tests")
st.markdown("""
Paste your URLs in the text box below (one URL per line, maximum 1000 URLs). The app fetches the overall **WCAG 2.0 AA Accessibility Score**
and provides details on specific audits that require attention for each URL using the Google PageSpeed Insights API.

**Important:** URLs should include the full protocol (e.g., https://www.example.com)
""")

# --- Important Considerations Expander ---
with st.expander("⚠️ Important Considerations & How to Interpret Results"):
    st.markdown(f"""
    *   **API Limits:** Google enforces [rate limits](https://developers.google.com/speed/docs/insights/v5/reference/limits). Large lists might hit these. The app uses a `{API_CALL_DELAY}s` delay.
    *   **Automated Testing Limitations:** This tool uses Lighthouse for *automated* checks based on WCAG principles. **Automated testing can only detect about 30% of accessibility issues**. Manual testing with screen readers and real users with disabilities is essential for full compliance.
    *   **Understanding Audit Categories:**
        * **Failed Audits ❌** - Accessibility issues automatically detected that must be fixed. These violate WCAG guidelines and affect users with disabilities.
        * **Requires Manual Verification ⚠️** - **Cannot be tested by machines**. These require human judgment and testing with assistive technologies. Even with 0 failed audits, your site may still have accessibility issues in these areas.
        * **Passed Audits ✅** - Automatically verifiable requirements that have been successfully met. This only confirms what machines can test.
        * **Not Applicable ⏩** - Audits that don't apply to your page (e.g., video audits when no videos are present).
    *   **WCAG Basis:** Lighthouse audits test for failures of WCAG success criteria. Audit IDs like 'image-alt' and 'link-name' directly relate to WCAG principles (Perceivable, Operable, Understandable, Robust).
    """)

# 1. Check for API Key (Same as before)
api_key = os.getenv("PAGESPEED_API_KEY")
if not api_key:
    st.error("🛑 **Error:** `PAGESPEED_API_KEY` environment variable not found.")
    st.stop()
# else:
#     masked_key = api_key[:4] + "****" + api_key[-4:]
#     st.success(f"✅ API Key found (ends in ...{masked_key[-8:]}).")
# Check for OpenRouter API Key
openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
if not openrouter_api_key:
    st.warning("⚠️ **Warning:** `OPENROUTER_API_KEY` environment variable not found. Gemini AI analysis will not be available.")
# else:
#     masked_openrouter_key = openrouter_api_key[:4] + "****" + openrouter_api_key[-4:]
#     st.success(f"✅ OpenRouter API Key found (ends in ...{masked_openrouter_key[-8:]}).")


# 2. Analysis Strategy Information
st.info("The will analyze URLs using both **desktop** and **mobile** strategies for comprehensive accessibility testing.")

# --- Session State Initialization ---
# Use session state to store results across reruns (e.g., when selecting a URL for details)
if 'results_df' not in st.session_state:
    st.session_state.results_df = None
if 'detailed_results' not in st.session_state:
    st.session_state.detailed_results = {} # Store detailed audits keyed by original index
if 'gemini_analyses' not in st.session_state:
    st.session_state.gemini_analyses = {} # Store Gemini analyses keyed by URL
if 'desktop_results' not in st.session_state:
    st.session_state.desktop_results = {}
if 'mobile_results' not in st.session_state:
    st.session_state.mobile_results = {}
if 'desktop_vitals' not in st.session_state:
    st.session_state.desktop_vitals = {}
if 'mobile_vitals' not in st.session_state:
    st.session_state.mobile_vitals = {}


# 3. URL Input & Processing Logic
st.subheader("Enter URLs to Analyze")
st.markdown("**Instructions:** Paste your URLs below, one per line. URLs should include https://www. for best results.")

url_input = st.text_area(
    "URLs (one per line, maximum 1000):",
    height=200,
    placeholder="https://www.example.com\nhttps://www.google.com\nhttps://www.github.com",
    help="Enter up to 1000 URLs, one per line. URLs should include the full protocol (https://)"
)

# Add a button to process URLs
process_urls = st.button("Analyze URLs", type="primary")

# Check if URLs should be processed
process_file = False
if process_urls and url_input.strip():
    # Parse and validate URLs
    raw_urls = [line.strip() for line in url_input.strip().split('\n') if line.strip()]
    
    # Validate URL count
    if len(raw_urls) > 1000:
        st.error(f"❌ **Error:** Too many URLs provided ({len(raw_urls)}). Maximum allowed is 1000.")
        st.stop()
    
    if len(raw_urls) == 0:
        st.warning("⚠️ No URLs found in the input. Please enter at least one URL.")
        st.stop()
    
    # Clean and validate URLs
    cleaned_urls = []
    invalid_urls = []
    
    for i, url in enumerate(raw_urls):
        # Basic URL validation and cleanup
        if not url or not isinstance(url, str):
            invalid_urls.append(f"Line {i+1}: Empty or invalid URL")
            continue
            
        url = url.strip()
        if not url:
            continue
            
        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
            
        # Basic URL format validation
        if not ('.' in url and len(url) > 10):
            invalid_urls.append(f"Line {i+1}: '{url}' - Invalid URL format")
            continue
            
        cleaned_urls.append(url)
    
    if invalid_urls:
        with st.expander("⚠️ Invalid URLs Found", expanded=False):
            for invalid in invalid_urls:
                st.warning(invalid)
    
    if not cleaned_urls:
        st.error("❌ **Error:** No valid URLs found after validation.")
        st.stop()
    
    # Create DataFrame from cleaned URLs
    df = pd.DataFrame({'urls': cleaned_urls})
    df.reset_index(drop=True, inplace=True)
    
    # Clear previous results when new URLs are processed
    st.session_state.results_df = None
    st.session_state.detailed_results = {}
    st.session_state.gemini_analyses = {}
    st.session_state.desktop_results = {}
    st.session_state.mobile_results = {}
    st.session_state.desktop_vitals = {}
    st.session_state.mobile_vitals = {}
    
    process_file = True
    st.success(f"Ready to process {len(df)} URLs using both desktop and mobile strategies...")

elif process_urls and not url_input.strip():
    st.warning("⚠️ Please enter some URLs in the text area above.")

if process_file:
    try:

        desktop_scores = []
        mobile_scores = []
        st.session_state.detailed_results = {} # Reset details for new run
        st.session_state.desktop_results = {}
        st.session_state.mobile_results = {}
        st.session_state.desktop_vitals = {}
        st.session_state.mobile_vitals = {}
        progress_bar = st.progress(0)
        status_text = st.empty()
        total_urls = len(df) * 4  # Each URL is processed 4 times (desktop/mobile for both accessibility and vitals)
        start_time = time.time()
        
        # Process counter for progress calculation
        process_count = 0

        for i, row in df.iterrows(): # Use iterrows to get index `i` easily
            url = row['urls']
            
            # Process desktop strategy
            process_count += 1
            current_progress = process_count / total_urls
            elapsed_time = time.time() - start_time
            avg_time_per_process = elapsed_time / process_count if process_count > 0 else elapsed_time
            estimated_remaining = (total_urls - process_count) * avg_time_per_process if avg_time_per_process > 0 else 0

            status_text.text(
                f"⚙️ Processing URL {i+1}/{len(df)} (Desktop): {url}\n"
                f"⏳ Estimated time remaining: {time.strftime('%M:%S', time.gmtime(estimated_remaining))}"
            )

            # Call the API function for desktop
            desktop_result = get_psi_accessibility_details(url, api_key, 'desktop')

            if "error" in desktop_result:
                desktop_scores.append(desktop_result["error"])
                st.session_state.desktop_results[i] = [{"error": desktop_result["error"]}]
            else:
                desktop_scores.append(desktop_result['score'])
                st.session_state.desktop_results[i] = desktop_result['audits']

            progress_bar.progress(current_progress)
            time.sleep(API_CALL_DELAY)
            
            # Process mobile strategy
            process_count += 1
            current_progress = process_count / total_urls
            elapsed_time = time.time() - start_time
            avg_time_per_process = elapsed_time / process_count if process_count > 0 else elapsed_time
            estimated_remaining = (total_urls - process_count) * avg_time_per_process if avg_time_per_process > 0 else 0

            status_text.text(
                f"⚙️ Processing URL {i+1}/{len(df)} (Mobile): {url}\n"
                f"⏳ Estimated time remaining: {time.strftime('%M:%S', time.gmtime(estimated_remaining))}"
            )

            # Call the API function for mobile
            mobile_result = get_psi_accessibility_details(url, api_key, 'mobile')

            if "error" in mobile_result:
                mobile_scores.append(mobile_result["error"])
                st.session_state.mobile_results[i] = [{"error": mobile_result["error"]}]
            else:
                mobile_scores.append(mobile_result['score'])
                st.session_state.mobile_results[i] = mobile_result['audits']

            progress_bar.progress(current_progress)
            time.sleep(API_CALL_DELAY)
            
            # Process desktop Core Web Vitals
            process_count += 1
            current_progress = process_count / total_urls
            elapsed_time = time.time() - start_time
            avg_time_per_process = elapsed_time / process_count if process_count > 0 else elapsed_time
            estimated_remaining = (total_urls - process_count) * avg_time_per_process if avg_time_per_process > 0 else 0

            status_text.text(
                f"⚙️ Processing URL {i+1}/{len(df)} (Desktop Vitals): {url}\n"
                f"⏳Estimated time remaining: {time.strftime('%M:%S', time.gmtime(estimated_remaining))}"
            )

            # Call the API function for desktop vitals
            desktop_vitals_result = get_core_web_vitals(url, api_key, 'desktop')

            if "error" in desktop_vitals_result:
                st.session_state.desktop_vitals[i] = {"error": desktop_vitals_result["error"]}
            else:
                st.session_state.desktop_vitals[i] = desktop_vitals_result

            progress_bar.progress(current_progress)
            time.sleep(API_CALL_DELAY)
            
            # Process mobile Core Web Vitals
            process_count += 1
            current_progress = process_count / total_urls
            elapsed_time = time.time() - start_time
            avg_time_per_process = elapsed_time / process_count if process_count > 0 else elapsed_time
            estimated_remaining = (total_urls - process_count) * avg_time_per_process if avg_time_per_process > 0 else 0

            status_text.text(
                f"⚙️ Processing URL {i+1}/{len(df)} (Mobile Vitals): {url}\n"
                f"⏳ Estimated time remaining: {time.strftime('%M:%S', time.gmtime(estimated_remaining))}"
            )

            # Call the API function for mobile vitals
            mobile_vitals_result = get_core_web_vitals(url, api_key, 'mobile')

            if "error" in mobile_vitals_result:
                st.session_state.mobile_vitals[i] = {"error": mobile_vitals_result["error"]}
            else:
                st.session_state.mobile_vitals[i] = mobile_vitals_result

            progress_bar.progress(current_progress)
            time.sleep(API_CALL_DELAY)

        end_time = time.time()
        total_time = end_time - start_time
        status_text.success(f"✅ Processing complete for {len(df)} URLs (desktop and mobile accessibility + Core Web Vitals) in {time.strftime('%M minutes %S seconds', time.gmtime(total_time))}!")

        # Store results in session state DataFrame
        df['Desktop Score'] = desktop_scores
        df['Mobile Score'] = mobile_scores
        st.session_state.results_df = df # Save the DataFrame to session state


    except pd.errors.EmptyDataError:
        st.error("❌ **Error:** The uploaded CSV file appears to be empty.")
        st.session_state.results_df = None # Clear results on error
        st.session_state.detailed_results = {}
        st.session_state.gemini_analyses = {}
        st.session_state.desktop_vitals = {}
        st.session_state.mobile_vitals = {}
    except Exception as e:
        st.error(f"An unexpected error occurred while processing the file: {e}")
        st.exception(e)
        st.session_state.results_df = None # Clear results on error
        st.session_state.detailed_results = {}
        st.session_state.gemini_analyses = {}
        st.session_state.desktop_vitals = {}
        st.session_state.mobile_vitals = {}

# --- Display Results ---
if st.session_state.results_df is not None:
    # st.subheader("📊 Summary Results")
    # st.dataframe(st.session_state.results_df, use_container_width=True)

    # --- Detailed View Section ---
    st.subheader("Detailed Audit Report")
    st.markdown("Select a URL from the list above to view its detailed accessibility audit results.")

    # Create options for the select box: "Index: URL"
    url_options = [f"{idx}: {url}" for idx, url in st.session_state.results_df['urls'].items()]

    if not url_options:
        st.warning("No URLs were processed successfully to show details for.")
    else:
        selected_option = st.selectbox("Choose URL to inspect:", options=url_options, index=0) # Default to first URL

        if selected_option:
            # Extract the index from the selected option string
            selected_index = int(selected_option.split(":")[0])
            current_url = st.session_state.results_df.loc[selected_index, 'urls']
            
            st.markdown(f"**Details for:** `{current_url}`")
            
            # Create tabs for desktop, mobile, and core web vitals results
            desktop_tab, mobile_tab, vitals_tab = st.tabs(["Desktop Results", "Mobile Results", "Core Web Vitals"])
            
            # Function to display audit results for a specific device type
            def display_audit_results(device_type, audits_to_display):
                if not audits_to_display:
                    st.info(f"No accessibility audits were found for this URL on {device_type}, or an error occurred during its analysis.")
                    return
                
                if "error" in audits_to_display[0]: # Check if the stored detail is an error message
                    st.error(f"Could not retrieve details due to a previous error: {audits_to_display[0]['error']}")
                    return
                
                # Group audits by category
                failed_audits = [a for a in audits_to_display if a.get('category') == 'failed']
                manual_audits = [a for a in audits_to_display if a.get('category') == 'manual_check']
                passed_audits = [a for a in audits_to_display if a.get('category') == 'passed']
                na_audits = [a for a in audits_to_display if a.get('category') == 'not_applicable']
                
                # Calculate automated testing metrics
                automated_testable = len(failed_audits) + len(passed_audits)
                automated_pass_rate = 0
                if automated_testable > 0:
                    automated_pass_rate = int((len(passed_audits) / automated_testable) * 100)
                
                # Create summary data for visualization
                categories = ["Failed", "Manual Check", "Passed", "Not Applicable"]
                counts = [len(failed_audits), len(manual_audits), len(passed_audits), len(na_audits)]
                
                # Create responsive columns - on mobile they'll stack vertically
                chart_col, metrics_col = st.columns([1, 1.5], gap="large")
                
                # Left column - Accessibility Audit Overview
                with chart_col:
                    st.subheader(f"{device_type} Accessibility Audit Overview")
                    
                    # Create the pie chart data
                    summary_df = pd.DataFrame({
                        "Category": categories,
                        "Count": counts
                    })
                    
                    # Create a pie chart
                    chart = st_alt.Chart(summary_df).mark_arc(innerRadius=50).encode(
                        theta=st_alt.Theta('Count:Q', stack=True),
                        color=st_alt.Color('Category:N',
                            scale=st_alt.Scale(
                                domain=categories,
                                range=['#ff4b4b', '#ffa500', '#00cc44', '#aaaaaa']
                            ),
                            legend=st_alt.Legend(
                                title="Category",
                                orient="bottom",
                                labelFontSize=11,
                                titleFontSize=12,
                                columns=2
                            )
                        ),
                        tooltip=[
                            st_alt.Tooltip('Category:N', title='Category'),
                            st_alt.Tooltip('Count:Q', title='Count'),
                            st_alt.Tooltip('Count:Q', title='Percentage', format='.1%', aggregate='mean')
                        ]
                    ).properties(
                        width=250,
                        height=250,
                        title={
                            "text": f"Audit Results Distribution",
                            "fontSize": 14,
                            "anchor": "start"
                        }
                    )
                    st.altair_chart(chart, use_container_width=False)
                
                # Right column - Automated Testing Results
                with metrics_col:
                    st.subheader("Automated Testing Results")
                    
                    if automated_testable > 0:
                        # Create a 2x2 grid for metrics
                        metric_col1, metric_col2 = st.columns(2)
                        
                        with metric_col1:
                            st.metric(
                                label="Total Automated Tests",
                                value=automated_testable,
                                help="Number of tests that can be verified by machines"
                            )
                            
                            st.metric(
                                label="Failed Tests",
                                value=len(failed_audits),
                                delta=None if len(failed_audits) == 0 else f"-{len(failed_audits)} issues",
                                delta_color="inverse",
                                help="Accessibility issues detected by automated testing"
                            )
                        
                        with metric_col2:
                            st.metric(
                                label="Passed Tests",
                                value=len(passed_audits),
                                delta=f"{automated_pass_rate}% pass rate",
                                delta_color="normal",
                                help="Tests that passed automated verification"
                            )
                            
                            st.metric(
                                label="Manual Checks",
                                value=len(manual_audits),
                                delta=None if len(manual_audits) == 0 else f"⚠️ {len(manual_audits)} checks",
                                delta_color="off",
                                help="Tests that MUST be verified by human testers"
                            )
                        
                        # Important note about automated testing limitations
                        st.info("**Note:** Automated testing can only detect ~30% of accessibility issues.")
                    else:
                        st.warning("No automated tests available for this page.")
                
                # Additional context for manual testing (full width below the columns)
                if len(manual_audits) > 0:
                    st.warning(f"⚠️ **Action Required:** {len(manual_audits)} accessibility aspects cannot be verified by automated tools and require manual testing with assistive technologies (screen readers, keyboard navigation, etc.)")
                
                # Use expanders for better organization
                if failed_audits:
                    with st.expander("❌ Failed Automated Tests", expanded=True):
                        st.markdown("These are accessibility issues that automated testing has detected and must be fixed:")
                        for audit in failed_audits:
                            with st.container():
                                st.markdown("---")
                                st.warning(f"**{audit.get('title')}** (ID: `{audit.get('id')}`)")
                                st.markdown(f"> {audit.get('description')}")
                                if audit.get('details_snippet') and audit.get('details_snippet') != " (No specific item snippet)":
                                    st.code(f"Example Snippet:\n{audit.get('details_snippet')}", language='html')
                
                # Gemini AI Analysis Section
                if failed_audits:
                    with st.expander("AI Analysis with Gemini", expanded=True):
                        analysis_key = f"{current_url}_{device_type.lower()}"
                        
                        if analysis_key in st.session_state.gemini_analyses:
                            st.markdown("### Gemini's Recommendations")
                            st.markdown(st.session_state.gemini_analyses[analysis_key])
                        else:
                            if st.button(f"Analyze {device_type} Issues with Gemini", key=f"gemini_{device_type.lower()}"):
                                with st.spinner("Sending to Gemini for analysis..."):
                                    analysis = get_gemini_analysis(failed_audits, f"{current_url} ({device_type})")
                                    
                                    # Store the analysis in session state
                                    st.session_state.gemini_analyses[analysis_key] = analysis
                                    
                                    # Update the results DataFrame to include the analysis
                                    column_name = f'Gemini Analysis ({device_type})'
                                    if column_name not in st.session_state.results_df.columns:
                                        st.session_state.results_df[column_name] = ""
                                    
                                    st.session_state.results_df.loc[selected_index, column_name] = analysis
                                    
                                    # Display the analysis
                                    st.markdown("### Gemini's Recommendations")
                                    st.markdown(analysis)
                                    
                                    # Rerun to update the UI
                                    st.rerun()
                
                # Manual Verification Section
                if manual_audits:
                    with st.expander("⚠️ Requires Manual Verification (Cannot Be Machine-Tested)", expanded=False):
                        st.warning("⚠️ **Important:** These aspects CANNOT be verified by automated tools and require human testing with assistive technologies.")
                        for audit in manual_audits:
                            with st.container():
                                st.markdown("---")
                                st.info(f"**{audit.get('title')}** (ID: `{audit.get('id')}`) - {audit.get('displayMode')}")
                                st.markdown(f"> {audit.get('description')}")
                                
                                if audit.get('details_snippet') and audit.get('details_snippet') != " (No specific item snippet)":
                                    st.code(f"Example Snippet:\n{audit.get('details_snippet')}", language='html')
                
                # Passed Audits Section
                if passed_audits:
                    with st.expander("✅ Passed Automated Tests", expanded=False):
                        st.success("These accessibility requirements have been successfully verified by automated testing (remember: this is only ~30% of accessibility requirements):")
                        for audit in passed_audits:
                            st.markdown(f"- **{audit.get('title')}** (ID: `{audit.get('id')}`)")
                
                # Not Applicable Section
                if na_audits:
                    with st.expander("⏩ Not Applicable Audits", expanded=False):
                        st.markdown("These audits don't apply to the current page, often because the page doesn't contain the relevant elements:")
                        for audit in na_audits:
                            st.markdown(f"- **{audit.get('title')}** (ID: `{audit.get('id')}`)")
            
            # Display desktop results
            with desktop_tab:
                desktop_audits = st.session_state.desktop_results.get(selected_index, [])
                display_audit_results("Desktop", desktop_audits)
            
            # Display mobile results
            with mobile_tab:
                mobile_audits = st.session_state.mobile_results.get(selected_index, [])
                display_audit_results("Mobile", mobile_audits)
            
            # Display Core Web Vitals results
            with vitals_tab:
                st.subheader("Core Web Vitals Analysis")
                
                # Get vitals data for both desktop and mobile
                desktop_vitals_data = st.session_state.desktop_vitals.get(selected_index, {})
                mobile_vitals_data = st.session_state.mobile_vitals.get(selected_index, {})
                
                # Create two columns for desktop and mobile vitals
                vitals_col1, vitals_col2 = st.columns(2)
                
                # Function to display vitals metrics
                def display_vitals_metrics(col, device_type, vitals_data):
                    with col:
                        st.markdown(f"### {device_type}")
                        
                        if "error" in vitals_data:
                            st.error(f"Could not retrieve Core Web Vitals: {vitals_data['error']}")
                            return
                        
                        # Display performance score
                        perf_score = vitals_data.get('performance_score', 'N/A')
                        if perf_score != 'N/A':
                            color = "🟢" if perf_score >= 90 else "🟡" if perf_score >= 50 else "🔴"
                            st.metric("Performance Score", f"{color} {perf_score}%")
                        else:
                            st.metric("Performance Score", "N/A")
                        
                        st.markdown("#### Core Web Vitals")
                        
                        # Display Core Web Vitals
                        core_vitals = vitals_data.get('core_web_vitals', {})
                        
                        for key, vital in core_vitals.items():
                            score = vital.get('score', 0)
                            value = vital.get('value', 'N/A')
                            name = vital.get('name', key.upper())
                            description = vital.get('description', '')
                            
                            # Determine status color based on score
                            if score >= 0.9:
                                status = "🟢 Good"
                            elif score >= 0.5:
                                status = "🟡 Needs Improvement"
                            else:
                                status = "🔴 Poor"
                            
                            with st.expander(f"{name}: {status} ({value})", expanded=True):
                                st.markdown(description)
                                
                                # Show thresholds for each metric
                                if key == 'lcp':
                                    st.info("**Thresholds:** Good < 2.5s | Needs Improvement 2.5s-4s | Poor > 4s")
                                elif key == 'fid':
                                    st.info("**Thresholds:** Good < 100ms | Needs Improvement 100ms-300ms | Poor > 300ms")
                                elif key == 'cls':
                                    st.info("**Thresholds:** Good < 0.1 | Needs Improvement 0.1-0.25 | Poor > 0.25")
                                elif key == 'inp':
                                    st.info("**Thresholds:** Good < 200ms | Needs Improvement 200ms-500ms | Poor > 500ms")
                        
                        # Additional metrics in an expander
                        additional = vitals_data.get('additional_metrics', {})
                        if additional:
                            with st.expander("Additional Performance Metrics", expanded=False):
                                for key, metric in additional.items():
                                    score = metric.get('score', 0)
                                    value = metric.get('value', 'N/A')
                                    name = metric.get('name', key.upper())
                                    
                                    # Determine status based on score
                                    if score >= 0.9:
                                        status_icon = "🟢"
                                    elif score >= 0.5:
                                        status_icon = "🟡"
                                    else:
                                        status_icon = "🔴"
                                    
                                    st.markdown(f"**{name}:** {status_icon} {value}")
                
                # Display desktop vitals
                display_vitals_metrics(vitals_col1, "Desktop", desktop_vitals_data)
                
                # Display mobile vitals
                display_vitals_metrics(vitals_col2, "Mobile", mobile_vitals_data)
                
                with st.expander("Understanding Core Web Vitals", expanded=False):
                    st.markdown("""
                    **Core Web Vitals** are a set of real-world, user-centered metrics that quantify key aspects of the user experience:
                    
                    1. **Largest Contentful Paint (LCP)**: Measures loading performance. LCP marks the point when the page's main content has likely loaded.
                    
                    2. **First Input Delay (FID)**: Measures interactivity. FID quantifies the experience users feel when trying to interact with unresponsive pages.
                    
                    3. **Cumulative Layout Shift (CLS)**: Measures visual stability. CLS helps quantify how often users experience unexpected layout shifts.
                    
                    4. **Interaction to Next Paint (INP)**: A newer metric that assesses overall responsiveness by measuring all interactions throughout the page lifecycle.
                    
                    **Why Core Web Vitals Matter:**
                    - They directly impact user experience
                    - Google uses them as ranking signals for search results
                    - They help identify performance bottlenecks
                    - They provide standardized metrics for measuring real-world performance
                    
                    **Note:** Lab data (like from PageSpeed Insights) provides estimates based on simulated conditions. Real user data may vary based on actual devices, networks, and user behavior.
                    """)

    # --- Download Button (using session state df) ---
    @st.cache_data # Cache the conversion
    def convert_df_to_csv(df_to_convert):
        
        if 'Gemini Analysis (Desktop)' not in df_to_convert.columns:
            df_to_convert['Gemini Analysis (Desktop)'] = ""
        if 'Gemini Analysis (Mobile)' not in df_to_convert.columns:
            df_to_convert['Gemini Analysis (Mobile)'] = ""
        
        return df_to_convert.to_csv(index=False).encode('utf-8')

    csv_output = convert_df_to_csv(st.session_state.results_df)

    st.download_button(
        label="Download Complete Analysis as CSV",
        data=csv_output,
        file_name='pagespeed_accessibility_summary_complete.csv',
        mime='text/csv',
    )

else:
    st.info("Enter URLs in the text area above and click 'Analyze URLs' to begin analysis.")
