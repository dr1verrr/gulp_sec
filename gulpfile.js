const {src, dest, watch, parallel, series} = require('gulp');

const scss = require('gulp-sass');
const browsersync = require('browser-sync').create();
const uglify = require('gulp-uglify-es').default;
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const del = require('del');
const fonter = require('gulp-fonter');
const babel = require('gulp-babel');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const fs = require('fs');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const svgstore = require('gulp-svgstore');
const inject = require('gulp-inject');
const fileinclude = require('gulp-file-include');


let src_folder = '#src';
let project_name = 'dist';

let path = {
	build:{
		html: project_name + '/',
		css: project_name + '/css/',
		js: project_name + '/js/',
		images: project_name + '/images/',
		fonts: project_name + '/fonts/'
	},
	src:{
		html: [src_folder + "/*.html", "!" + src_folder + "/_*.html"],
		js: [src_folder + "/js/main.js", src_folder + "/js/vendors.js"],
		css: src_folder + "/scss/style.scss",
		images: src_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
		fonts: src_folder + "/fonts/*.ttf"
	},
	watch:{
		html: src_folder + "/**/*.html",
		js: src_folder + "/**/*.js",
		css: src_folder + "/scss/**/*.scss",
		images: src_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}"
	},
	clean: "./" + project_name + "/"
};

function browserSync(){
	browsersync.init({
		server:{
			baseDir: "./" + project_name + "/"
		},
		notify: false,
	})
}

function html() {
	return src(path.src.html, {})
		.pipe(plumber())
		.pipe(fileinclude())
		.pipe(dest(path.build.html))
		.pipe(browsersync.stream());
}

function styles() {
	return src(path.src.css)
		.pipe(plumber())
		.pipe(scss({ outputStyle: 'expanded' }))
		.pipe(autoprefixer({
			overrideBrowserslist:['last 5 versions'],
			grid: true
		}))
		.pipe(dest(path.build.css))
		.pipe(rename({
			extname: '.min.css'
		}))
		.pipe(scss({ outputStyle: 'compressed' }))
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream())
	}

	function scripts() {
		return src(path.src.js)
			.pipe(plumber())
			.pipe(fileinclude())
			.pipe(babel({
   		   presets: ["@babel/preset-env"]
   		 }))
			.pipe(dest(path.build.js))
			.pipe(uglify(/* options */))
			.pipe(
				rename({
					suffix: ".min",
					extname: ".js"
				})
			)
			.pipe(dest(path.build.js))
			.pipe(browsersync.stream());
	}

	function images(){
		return src(path.src.images)
		.pipe(imagemin([
				imagemin.gifsicle({interlaced: true}),
				imagemin.mozjpeg({quality: 75, progressive: true}),
				imagemin.optipng({optimizationLevel: 4}),
				imagemin.svgo({
					 plugins: [
						  {removeViewBox: false},
						  {cleanupIDs: false}
					 ]
				})
			]
		))
		.pipe(dest(path.build.images))
	}

	function fonts_otf() {
		return src('#src/fonts/*.otf')
			.pipe(fonter({
				formats: ['ttf']
			}))
			.pipe(dest('#src/fonts'));
	}

	function fonts() {
		src(path.src.fonts)
			.pipe(plumber())
			.pipe(ttf2woff())
			.pipe(dest(path.build.fonts))
		return src(path.src.fonts)
			.pipe(ttf2woff2())
			.pipe(dest(path.build.fonts))
			.pipe(browsersync.stream())
	}


	function fontstyle() {
		let file_content = fs.readFileSync(src_folder + '/scss/_fonts.scss');
		if (file_content == '') {
			fs.writeFile(src_folder + '/scss/_fonts.scss', '', cb);
			return fs.readdir(path.build.fonts, function (err, items) {
				if (items) {
					let c_fontname;
					for (var i = 0; i < items.length; i++) {
						let fontname = items[i].split('.');
						fontname = fontname[0];
						if (c_fontname != fontname) {
							fs.appendFile(src_folder + '/scss/_fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
						}
						c_fontname = fontname;
					}
				}
			})
		}
	}
	function cb() { }

	

	function svg () {
		var svgs = src('#src/**/*.svg')
		.pipe(svgstore({ inlineSvg: true }));
	
	function fileContents (filePath, file) {
		return file.contents.toString();
	}
	
	return src('#src/index.html')
		.pipe(inject(svgs, { transform: fileContents }))
		.pipe(dest('dist/'));
	}
	

	function cleanDist(){
		return del('dist');
	}

function watchFiles() {
	watch([path.watch.html], html);
	watch([path.watch.css], styles);
	watch([path.watch.js], scripts);
	watch([path.watch.images], images);
}


let build = series(cleanDist, fonts_otf, parallel(html, styles, scripts, images), fonts, parallel(fontstyle));
let watching = parallel(build, watchFiles, browserSync);

exports.html = html;
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.svg = svg;
exports.fonts 	= fonts;
exports.fonts_otf = fonts_otf;
exports.fontstyle = fontstyle;
exports.cleanDist = cleanDist;
exports.build = build;
exports.watching = watching;
exports.default = watching;
