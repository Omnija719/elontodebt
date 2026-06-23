require 'open-uri'
require 'json'
require 'openssl'
require 'time'

MAX_RETRIES = 3
RETRY_DELAY = 2

def fetch_with_retry(url, description, max_retries: MAX_RETRIES)
  ssl_options = { ssl_verify_mode: OpenSSL::SSL::VERIFY_NONE }
  user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
  
  max_retries.times do |attempt|
    begin
      puts "#{description}#{attempt > 0 ? " (Attempt #{attempt + 1}/#{max_retries})" : ""}"
      response = URI.open(url, "User-Agent" => user_agent, **ssl_options).read
      return response
    rescue OpenURI::HTTPError => e
      if e.io.status[0].to_i == 503 && attempt < max_retries - 1
        wait_time = RETRY_DELAY * (2 ** attempt)
        puts "⚠️  Received 503 error. Retrying in #{wait_time} seconds..."
        sleep(wait_time)
      else
        raise
      end
    rescue => e
      if attempt < max_retries - 1
        wait_time = RETRY_DELAY * (2 ** attempt)
        puts "⚠️  Error: #{e.message}. Retrying in #{wait_time} seconds..."
        sleep(wait_time)
      else
        raise
      end
    end
  end
end

begin
  # 1. Fetch US Debt
  debt_url = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=1"
  puts "Fetching U.S. Debt..."
  debt_response = fetch_with_retry(debt_url, "Fetching U.S. Debt...")
  debt_json = JSON.parse(debt_response)
  latest_debt = debt_json['data'][0]
  total_debt = latest_debt['tot_pub_debt_out_amt'].to_f
  debt_date = latest_debt['record_date']
  puts "✓ U.S. Debt: $#{total_debt}"

  # 2. Fetch Forbes with retry logic
  forbes_url = "https://www.forbes.com/forbesapi/person/rtb/0/position/true.json"
  puts "Fetching Forbes list..."
  forbes_response = fetch_with_retry(forbes_url, "Fetching Forbes list...", max_retries: 5)
  forbes_json = JSON.parse(forbes_response)
  persons_lists = forbes_json.dig('personList', 'personsLists') || []
  
  elon = persons_lists.find { |p| p['uri'] == 'elon-musk' || p['name'].to_s.downcase.include?('elon musk') || p['personName'].to_s.downcase.include?('elon musk') }
  
  if elon
    # finalWorth is in millions of USD, e.g. 300000 = 300,000,000,000 (300 billion)
    elon_worth = elon['finalWorth'].to_f * 1_000_000
    puts "✓ Elon Net Worth: $#{elon_worth}"
  else
    puts "⚠️  Elon not found! Top persons:"
    persons_lists[0..4].each { |p| puts "- #{p['personName']}: #{p['finalWorth']}" }
    raise "Elon Musk not found in Forbes list"
  end

  ratio = total_debt / elon_worth
  puts "✓ Ratio: #{ratio}"

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
  puts "✓ Successfully updated data.json"

  # Generate dynamic social share image
  puts "Generating dynamic social share image..."
  if system("python3 \"#{script_dir}/generate_og.py\"")
    puts "✓ Social share image updated successfully."
  else
    puts "⚠️  Warning: Failed to generate social share image (python3/Pillow might not be configured)."
  end

rescue => e
  puts "❌ Error: #{e.message}"
  puts e.backtrace.join("\n")
  exit 1
end
