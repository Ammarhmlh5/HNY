module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: '16'
                },
                modules: 'commonjs'
            }
        ]
    ],
    plugins: [],
    env: {
        test: {
            presets: [
                [
                    '@babel/preset-env',
                    {
                        targets: {
                            node: 'current'
                        }
                    }
                ]
            ]
        }
    }
};