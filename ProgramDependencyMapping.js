
exports.p2dMap = [
    {
        "program": "Program1",
        "waitInterval": "day",  /* hour, day, week, none */
        "dependencies": [
            {
                "type": "file",
                "key": "/foo/bar/input1.csv"
            },
            {
                "type": "file",
                "key": "/foo/bar/input2.csv"
            }
        ]
    },
    {
        "program": "Program2",
        "waitInterval": "day",  /* hour, day, week, none */
        "dependencies": [
            {
                "type": "file",
                "key": "/foo/bar/input2.csv"
            },
            {
                "type": "file",
                "key": "/foo/bar/input3.csv"
            }
        ]
    }
];

exports.d2pMap = [
    {
        "dependency": {
            "type": "file",
            "key": "/foo/bar/input1.csv"
        },
        "programs": [
            "Program1"
        ]
    },
    {
        "dependency": {
            "type": "file",
            "key": "/foo/bar/input2.csv"
        },
        "programs": [
            "Program1",
            "Program2"
        ]
    },
    {
        "dependency": {
            "type": "file",
            "key": "/foo/bar/input3.csv"
        },
        "programs": [
            "Program2"
        ]
    }
];
