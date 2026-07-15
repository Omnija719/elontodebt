require 'open-uri'
require 'json'
require 'openssl'
require 'time'

begin
  # Ignore SSL if there are certificate issues
  ssl_options = { ssl_verify_mode: OpenSSL::SSL::VERIFY_NONE }

  # 1. Fetch US Debt
  debt_url = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page%5Bsize%5D=1"
  puts "Fetching U.S. Debt..."
  debt_response = URI.open(debt_url, "User-Agent" => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", **ssl_options).read
  debt_json = JSON.parse(debt_response)
  latest_debt = debt_json['data'][0]
  total_debt = latest_debt['tot_pub_debt_out_amt'].to_f
  debt_date = latest_debt['record_date']
  puts "U.S. Debt: $#{total_debt}"

  # 2. Fetch Forbes
  forbes_url = "https://forbes400.onrender.com/api/forbes400?limit=10"
  puts "Fetching Forbes list from mirror..."
  forbes_response = URI.open(forbes_url, "User-Agent" => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", **ssl_options).read
  forbes_json = JSON.parse(forbes_response)
  
  elon = forbes_json.find { |p| p['personName'].to_s.downcase.include?('elon musk') || p['uri'] == 'elon-musk' }
  
  if elon
    # finalWorth is in millions of USD
    elon_worth = elon['finalWorth'].to_f * 1_000_000
    puts "Elon Net Worth: $#{elon_worth}"
  else
    puts "Elon not found! Top persons:"
    forbes_json[0..4].each { |p| puts "- #{p['personName']}: #{p['finalWorth']}" }
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

  # === Smart History: Only log when ratio actually changes ===
  history_file = "#{script_dir}/history.json"
  history = File.exist?(history_file) ? JSON.parse(File.read(history_file)) : []

  # Clean bad entries
  history.reject! { |h| h.nil? || h['date'].nil? }

  today = Time.now.getlocal("-06:00").strftime("%Y-%m-%d")

  # Get the latest ratio (if any)
  last_ratio = history.last ? history.last['ratio'].to_f : 0.0

  # Only add if ratio changed by more than 0.01 (adjust threshold if you want)
  if (ratio - last_ratio).abs > 0.01 || history.empty?
    history << {
      date: today,
      ratio: ratio,
      elon_worth: elon_worth,
      us_debt: total_debt
    }
    puts "Added new history entry for #{today} (ratio changed from #{last_ratio.round(4)} to #{ratio.round(4)})"
  else
    puts "Ratio unchanged (#{ratio.round(4)}) — skipping history entry for #{today}"
  end

  # Safe sort
  history.sort_by! { |h| h['date'].to_s }

  File.write(history_file, JSON.pretty_generate(history))
  puts "History updated (#{history.length} total records)"

  # Safe sort
  history.sort_by! { |h| h['date'].to_s }

  File.write(history_file, JSON.pretty_generate(history))
  puts "History updated (#{history.length} total records)"
  
  # Generate dynamic social share image
  puts "Generating dynamic social share image..."
  if system("python3 \"#{script_dir}/generate_og.py\"")
    puts "Social share image updated successfully."
  else
    puts "Warning: Failed to generate social share image (python3/Pillow might not be configured)."
  end

rescue => e
  puts "Error: #{e.message}"
  puts e.backtrace.join("\n")
  exit 1
end
