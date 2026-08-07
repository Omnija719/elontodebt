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

  # 2. Fetch Net Worth (from Wikipedia since Forbes APIs are down)
  wiki_url = "https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvsection=0&titles=Elon_Musk&format=json"
  puts "Fetching Elon Musk net worth from Wikipedia..."
  wiki_response = URI.open(wiki_url, "User-Agent" => "Mozilla/5.0", ssl_verify_mode: OpenSSL::SSL::VERIFY_NONE).read
  wiki_json = JSON.parse(wiki_response)
  content = wiki_json.dig("query", "pages").values.first.dig("revisions", 0, "*")
  
  match = content.match(/US\$([0-9.]+)\s+(billion|trillion)/i)
  if match
    val = match[1].to_f
    mult = match[2].downcase == 'trillion' ? 1_000_000_000_000 : 1_000_000_000
    elon_worth = val * mult
    puts "Elon Net Worth: $#{elon_worth}"
  else
    raise "Could not parse Elon Musk's net worth from Wikipedia"
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

    # === History: Log every time ratio changes ===
  history_file = "#{script_dir}/history.json"
  history = File.exist?(history_file) ? JSON.parse(File.read(history_file)) : []

  # Clean bad entries
  history.reject! { |h| h.nil? || h['date'].nil? }

  today = Time.now.getlocal("-06:00").strftime("%Y-%m-%d")
  last_ratio = history.last ? history.last['ratio'].to_f : nil

  # Add entry if ratio is different
  if last_ratio.nil? || (ratio - last_ratio).abs > 0.0001
    history << {
      date: today,
      ratio: ratio,
      elon_worth: elon_worth,
      us_debt: total_debt
    }
    puts "Added new history entry for #{today}"
  else
    puts "Ratio unchanged — skipping history entry"
  end

  history.sort_by! { |h| h['date'].to_s }
  File.write(history_file, JSON.pretty_generate(history))
  puts "History updated (#{history.length} total records)"

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
