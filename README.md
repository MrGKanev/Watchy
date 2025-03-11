# Watchy

Everybody has to trace his time even at work. Years ago I had to trace it and coudn't find a good and lite software for it. This is how Watch is born. 


## Useful Commands

* Continuously watch for changes in the `style.css` file, updating the output file whenever changes occur.

```bash
npx @tailwindcss/cli -i ./assets/style.css -o ./assets/style.min.css --watch
```

* Generate a minified version of the CSS

```bash
npx @tailwindcss/cli -i ./assets/style.css -o ./assets/style.min.css --minify 
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.