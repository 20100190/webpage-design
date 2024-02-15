from flask import Flask, render_template
import pandas as pd

app = Flask(__name__)


@app.route('/')
def index():
    data = {
        'columns': [
            {'name': 'Column 1'},
            {'name': 'Column 2'},
            {'name': 'Column 3'},
            {'name': 'Column 4'}
            # More columns...
        ],
        'rows': [
            {'cells': [{'value': 'Row 1, Cell 1'}, {'value': 'Row 1, Cell 2'}, {'value': 'Row 1, Cell 3'}]},
            {'cells': [{'value': 'Row 2, Cell 1'}, {'value': 'Row 2, Cell 2'}, {'value': 'Row 2, Cell 3'}]},
            # More rows...
        ]
    }

    return render_template('index.html', dataset=data)


if __name__ == '__main__':
    app.run()
