# Installation script for TimeCounter
# ONLY RUN THIS ON CLEAN INSTALLATIONS

sudo su -

echo "Installing packages..."
apt update
apt install curl git

# 1. Install NodeJS using n
echo "Installing NodeJS"
curl -fsSL https://raw.githubusercontent.com/tj/n/master/bin/n | bash -s lts
npm i -g n

# 2. Install PM2
echo "Installing PM2"
npm i -g pm2

# 3. Download TimeCounter
echo "Downloading TimeCounter"
mkdir -p /opt/timecounter
cd /opt/timecounter
git clone https://gitlab.ahst.sk/filip/timecounter
cp config.example.json config.json
echo "Downloading npm packages"
npm ci
cd web
npm ci
echo "Building web interface..."
npm run build
cd /opt/timecounter

# 4. Launch TimeCounter as a pm2 service
echo "Launching the TimeCounter server"
pm2 start /opt/timecounter/index.js --name timecounter
pm2 startup
pm2 save

echo "Finished installation!"
echo "TimeCounter is now running on the specified port"
echo "Please edit the config file at /opt/timecounter/config.json"
echo "After editing, restart TimeCounter by running sudo pm2 restart timecounter"
echo "We recommend running TimeCounter behind a reverse proxy, such as NGINX"
echo "If you'd like to just run TimeCounter as simple as possible on HTTP, edit the port in the config file to 80"
