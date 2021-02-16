"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const env_1 = require("./env");
var fs = require('fs');
const mainurl = env_1.environment.serverUrl;
const eng = '/en/';
const AxiosInstance = axios_1.default.create();
let enJsonFile = 'en.json';
let frJsonFile = 'fr.json';
let enArticleData = [];
let frArticleData = [];
let authorImg = '';
for (let i = 0; i < mainurl.length; i++) {
    const targeturl = mainurl[i];
    (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(targeturl);
            const html = response.data;
            const $ = cheerio_1.default.load(html);
            const thumbnail = $('.list_articles > li > a');
            thumbnail.each((i, elem) => {
                const thumbnailUrl = $(elem).attr().href;
                AxiosInstance.get(thumbnailUrl)
                    .then(response => {
                    const htmlcontent = response.data;
                    const $ = cheerio_1.default.load(htmlcontent);
                    const content = $('#page').html();
                    const title = $(content).find('#single_hero_content_title').text().trim();
                    const summary = $(content).find('#single_post_excerpt > p').text();
                    const author = $(content).find('#single_hero_content_pre_title').text().slice(3);
                    const authorDescription = $(content).find('#single_post_content > p:last-child').text();
                    const artcilehtml = $('#single_post_content_container').children().html().replace(/[\t\n]+/gm, '');
                    const htmlContent = artcilehtml.replace(/\"/g, "");
                    const publishDate = $(content).find('#single_hero_content_surtitle').text();
                    authorImg = $(content).find('#single_post_author_pic').html();
                    if (authorImg) {
                        authorImg = $(content).find('#single_post_author_pic').attr().style.slice(24, -3);
                    }
                    else {
                        console.log("No");
                    }
                    if (thumbnailUrl.includes(eng)) {
                        enArticleData.push({
                            title: title,
                            summary: summary,
                            author: author,
                            authorDescription: authorDescription,
                            htmlContent: htmlContent,
                            publishDate: publishDate,
                            language: "English",
                            publicUrl: targeturl,
                            authorImg: authorImg,
                            thumbnailUrl: thumbnailUrl
                        });
                        fs.writeFile(enJsonFile, JSON.stringify(enArticleData), function (err) {
                            if (err)
                                throw authorImg = null;
                        });
                    }
                    else {
                        frArticleData.push({
                            title: title,
                            summary: summary,
                            author: author,
                            authorDescription: authorDescription,
                            htmlContent: htmlContent,
                            publishDate: publishDate,
                            language: "French",
                            publicUrl: targeturl,
                            authorImg: authorImg,
                            thumbnailUrl: thumbnailUrl
                        });
                        fs.writeFile(frJsonFile, JSON.stringify(frArticleData), function (err) {
                            if (err)
                                throw authorImg = null;
                        });
                    }
                });
            });
        }
        catch (error) {
            if (error) {
                authorImg = null;
            }
            ;
        }
    }))();
}
//# sourceMappingURL=index.js.map