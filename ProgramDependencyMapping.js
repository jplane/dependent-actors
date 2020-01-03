
const p2dMap = [
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

exports.p2dMap = p2dMap;

exports.d2pMap = () => {

    const flattened = p2dMap.flatMap(progItem => progItem.dependencies.map(dep => {
        return {
            dep: dep,
            program: progItem.program
        };
    }));
    
    const grouped = groupBy(flattened, el => el.dep.type + ":" + el.dep.key);

    return grouped.map(g => {
        return { dependency: g.dependency, programs: g.programs };
    });
}

function groupBy(arr, keyFunc) {
    return arr.reduce(function (accum, curr) {
        const k = keyFunc(curr);
        let existing = accum.find(el => el && el.key === k);
        if (existing) {
            existing.programs.push(curr.program);
        } else {
            accum.push({ key: k, dependency: curr.dep, programs: [curr.program] }); 
        }
        return accum; 
    }, []);
}
