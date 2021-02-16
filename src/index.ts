import axios from 'axios'
import cheerio from 'cheerio'
import moment from 'moment'
import * as fs from 'fs'
import * as download from 'image-downloader'
import * as slugify from 'slugify'

const serverUrls = [
    'https://mrex.co/en/the-complete-guide-to-multifamily-real-estate-investing/',
    'https://mrex.co/fr/guide-complet-de-linvestissement-en-immobilier-multilogements/'
]

const baseUrl = 'https://mrex-blogs.s3.ca-central-1.amazonaws.com'

interface Article {
    id: string
    title: string
    summary: string
    author: string
    authorDescription: string
    html: string
    publishDate: string
    language: string
    publicUrl: string
    authorImg: string
    thumbnailUrl: string
}

const AxiosInstance = axios.create()
let articlesData: Article[] = []

serverUrls.map(async (targetUrl) => {
    const response = await axios.get(targetUrl)
    const html = response.data
    const $ = cheerio.load(html)
    const articles = $('.list_articles > li > a')

    articles.each(async (i, elem) => {
        const publicUrl = $(elem).attr().href
        let publishDate

        await AxiosInstance.get(publicUrl)
            .then(async (response) => {
                let authorImg, html, thumbnailImage
                html = response.data
                const $ = cheerio.load(html)
                const content = $('#page').html()
                const title = $(content).find('#single_hero_content_title').text().trim()
                const summary = $(content).find('#single_post_excerpt > p').text()
                const author = $(content).find('#single_hero_content_pre_title').text().slice(3)
                const authorDescription = $('#single_post_author_pic ~ p').text()

                try {
                    thumbnailImage = $(content).find('#single_post_img').attr('data-src')
                } 
                catch (error) {
                    console.warn("Unable to get thumbnailImage section or thumbnailImage undefined!")
                    thumbnailImage = null
                }

                const language = publicUrl.includes('/en/') ? 'en' : 'fr'
                moment.locale(language)

                const dateStr = $(content).find('#single_hero_content_surtitle').text()

                if (language === 'en') {
                    publishDate = moment(dateStr, 'll').unix()
                } 
                else {
                    try {
                        publishDate = moment(dateStr, 'D MMM YYYY').unix()
                    }
                    catch (error) {
                        publishDate = moment(dateStr, 'LLL').unix()
                    }
                }
 
                // console.log(`*************************************\n\t${publicUrl}\n\t${language}\n\t${dateStr}\n\t${publishDate}`)
                
                try {
                    html = $('#single_post_content_container')
                                    .children()
                                    .html()
                                    .replace(/[\t\n]+/gm, '')
                                    .replace(/\"/g, "")
                }
                catch (error) {
                    console.warn("This section was not found or not able to get content!")
                    html = null
                }

                let srcattr = $(html).find('img').map(function() {
                    return $(this).attr('src')                    
                }).get();

                srcattr.forEach(async (src) => {
                    const href = $(html).find('a[href]').attr('href');
                    html = html.replace(src, `./images/${src.split('/').pop()}`)
                    .replace(/\salt(.*?)>/gm, '>')

                    html = html.replace(/<a[^>]*>/g, '<a href=' + `${href}` + ' ' + 'target=_blank>')
                    //  download all of the images in content
                    try {
                        await  download.image({
                            url: src,
                            dest: './data/images/',
                        })    
                        
                    } catch (error) {
                        console.error(`Unable to get image at url: ${src}`);
                    }
                });


                try {
                    authorImg = $(content).find('#single_post_author_pic').attr('data-src')
                } 
                catch (error) {
                    console.warn("Unable to get authorImage section or author Image undefined!")
                    authorImg = null
                }

                const data: Article = {
                    id: slugify.default(title, { lower: true, strict: true }),
                    title,
                    summary,
                    author,
                    authorDescription,
                    html,
                    publishDate,
                    language,
                    publicUrl,
                    authorImg: authorImg && authorImg.split('/').pop(),
                    thumbnailUrl: thumbnailImage && thumbnailImage.split('/').pop()
                }
                articlesData.push(data)
                
                // download thumbnail image
                try {
                    await download.image({
                        url: thumbnailImage,
                        dest: './data/images/',
                    })
                }
                catch (err) {
                    console.warn(`Failed to download thumbnailImage for article ${publicUrl}. Reason: ${err}`)
                }

                // download thumbnail image
                try {
                    if (authorImg) {
                        await download.image({
                            url: authorImg,
                            dest: './data/authors/',
                        })
                    }
                }
                catch (err) {
                    console.error(`Failed to download authorImg for article ${publicUrl}`)
                }

                // cleanup
                const _articlesData = articlesData
                    .map(x => ({
                        ...x,
                        authorImg: `${baseUrl}/authors/${x.authorImg}`,
                        thumbnailUrl: `${baseUrl}/images/${x.thumbnailUrl}`,
                        publishDate: new Date((x.publishDate as any) * 1000),
                    }))
                    .map(x => {
                        x.html = x.html && x.html.replace(/.\/images\//g, `${baseUrl}/images/`)
                        return x
                    })
                    .filter(x => x.id)

                    fs.writeFile('./data/articles.json', JSON.stringify(_articlesData), (err) => {
                        if (err) {
                            throw err
                        }
                    })
            }
        )
        
    })
})
