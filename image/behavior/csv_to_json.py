import pandas as pd
csv_path = "../instructions.csv"
destination_file = "../jsondata.json"

import csv
import json

csvfile = open('../instructions.csv', 'r')
jsonfile = open('../jsondata.json', 'w')

reader = csv.DictReader(csvfile)
out = json.dumps([ row for row in reader ])
jsonfile.write(out)