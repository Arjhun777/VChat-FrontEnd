module.exports = {
    presets: [
        [
            "@babel/preset-env", {
                targets: {
                    esmodules: true
                },
                useBuiltIns: "entry"
            }
        ],
        "@babel/preset-react"
    ],
    plugins: [
        "@babel/plugin-proposal-optional-chaining",
        ["@babel/plugin-proposal-class-properties", { loose: true }]
    ]
}