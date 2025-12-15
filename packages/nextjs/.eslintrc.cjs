module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  overrides: [
    {
      files: ["next-env.d.ts", "**/next-env.d.ts"],
      rules: {
        "@typescript-eslint/triple-slash-reference": "off",
      },
    },
  ],
};
