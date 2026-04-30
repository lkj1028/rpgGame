import re

with open('index.html', 'r') as f:
    html = f.read()

with open('css/style.css', 'r') as f:
    css = f.read()

with open('js/data.js', 'r') as f:
    data_js = f.read()

with open('js/game.js', 'r') as f:
    game_js = f.read()

html = re.sub(r'<link rel="stylesheet" href="css/style.css">', '', html)
html = re.sub(r'<script src="js/data.js"></script>', '', html)
html = re.sub(r'<script src="js/game.js"></script>', '', html)

html = html.replace('</head>', '<style>\n' + css + '\n</style>\n</head>')
html = html.replace('</body>', '<script>\n' + data_js + '\n' + game_js + '\n</script>\n</body>')

with open('rpg.html', 'w') as f:
    f.write(html)

print("Done! rpg.html created.")
