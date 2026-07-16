require 'open-uri'
require 'json'
require 'openssl'
require 'time'

def fetch_with_retry(url, max_retries = 4)
  retries = 0
  begin
    URI.open(url, 
             "User-Agent" => "Mozilla/5.0", 
             ssl_verify_mode: OpenSSL::SSL::VERIFY_NONE).read
  rescue => e
    retries += 1
    if retries < max_retries
      puts "Retrying... (attempt #{retries})"
      sleep(3)
      retry
    else
      raise e
    end
  end
end

begin
  # 1. Fetch US Debt with retry
  debt_url = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page%5Bsize%5D=1"
  puts "Fetching U.S. Debt..."
  debt_response = fetch_with_retry(debt_url)
  debt_json = JSON.parse(debt_response)
  latest_debt = debt_json['data'][0]
  total_debt = latest_debt['tot_pub_debt_out_amt'].to_f
  debt_date = latest_debt['record_date']
  puts "U.S. Debt: $#{total_debt}"

  # 2. Fetch Forbes with retry
  forbes_url = "https://forbes400.onrender.com/api/forbes400?limit=10"
  puts "Fetching Forbes list from mirror..."
  forbes_response = fetch_with_retry(forbes_url)
  forbes_json = JSON.parse(forbes_response)
  
  elon = forbes_json.find { |p| p['personName'].to_s.downcase.include?('elon musk') || p['uri'] == 'elon-musk' }
  
  if elon
    elon_worth = elon['finalWorth'].to_f * 1_000_000
    puts "Elon Net Worth: $#{elon_worth}"
  else
    raise "Elon Musk not found in Forbes list"
  end

  ratio = total_debt / elon_worth
  puts "Ratio: #{ratio}"

  # Save to data.json
  result = {
    us_debt: total_debt,
    us_debt_date: debt_date,
    elon_worth: elon_worth,
    ratio: ratio,
    last_updated: Time.now.getlocal("-06:00").strftime("%Y-%m-%d %H:%M:%S MDT")
  }

  script_dir = File.dirname(__FILE__)
  File.write("#{script_dir}/data.json", JSON.pretty_generate(result))
  puts "Successfully updated data.json"

  # === History block (keep your current one) ===
  # Paste your history code here

  # Generate OG image
  puts "Generating dynamic social share image..."
  if system("python3 \"#{script_dir}/generate_og.py\"")
    puts "✅ Dynamic OG image generated with ratio #{ratio.round(2)}"
  end

rescue => e
  puts "ERROR: #{e.message}"
  puts e.backtrace.join("\n")
  exit 1
end
