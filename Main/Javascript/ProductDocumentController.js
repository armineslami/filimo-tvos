class ProductDocumentController extends DocumentController {
    
    constructor(controllerOptions) {
        super(controllerOptions)  
        if (controllerOptions.event) {
            this._movieUID = controllerOptions.event.target.dataItem.uid
            this._movieName = toPersianDigits(controllerOptions.event.target.dataItem.movie_title || controllerOptions.event.target.dataItem.title)
            this._movieImgBig = controllerOptions.event.target.dataItem.movie_img_b || controllerOptions.event.target.dataItem.image
            this._shouldPlayMovie = (controllerOptions.event.type === "play")
        } else if (controllerOptions.movieUID) {
            this._movieUID = controllerOptions.movieUID
            this._movieName = null
            this._movieImgBig = null
            this._shouldPlayMovie = controllerOptions.shouldPlayMovie
        }   
        this._isLoggedInAtLaunch = isLoggedIn()
    }
    
    setupDocument(document) {
        super.setupDocument(document)
        
        const loadingTemplate = document.getElementsByTagName('loadingTemplate').item(0)
        const loadingTitle = loadingTemplate.getElementsByTagName('title').item(0)
        const loadingImage = loadingTemplate.getElementsByTagName("heroImg").item(0)
        const productTemplate = document.getElementsByTagName('productTemplate').item(0)
        const mainNode = loadingTemplate.parentNode
        
        if (this._movieUID == null) {
            return
        }
        
        var isLoggedInAtLaunch = this._isLoggedInAtLaunch
        const dataLoader = this.dataLoader
        const documentLoader = this.documentLoader
        
        const playButton = document.getElementById("playButton")
        const bookmarkButton = document.getElementById('bookmarkButton')
        const previewButton = document.getElementById('previewButton')
        const seasonsButton = document.getElementById('seasonsButton')
        
        const castsShelf = document.getElementById('castsShelf')
        
        let recommendationSectionNode = document.getElementById("recommendation")
        recommendationSectionNode.dataItem = new DataItem()
        
        previewButton.parentNode.removeChild(previewButton)
        
        if (this._movieName && this._movieName.length > 0) {
            loadingTitle.textContent = this._movieName
        } else {
            loadingTitle.textContent = 'در حال دریافت اطلاعات…'
        }
        
        if (this._movieImgBig && this._movieImgBig.length > 0) {
            loadingImage.setAttribute("src", this._movieImgBig);
        } else {
            loadingImage.parentNode.removeChild(loadingImage);
        }
        
        mainNode.removeChild(productTemplate)
        
        let shouldPlay = this._shouldPlayMovie || false
        let moreInfoURL = legacyBaseURL + '/movie/uid/' + this._movieUID
        dataLoader._fetchJSONData(documentLoader.prepareURL(moreInfoURL), null, (dataObj) => {
            mainNode.removeChild(loadingTemplate)
            mainNode.appendChild(productTemplate)
            
            let movieInfo = dataObj.movie
            
            playButton.getElementsByTagName('title').item(0).textContent = movieInfo.price_txt || 'پخش فیلم'
            
            document.getElementById("title").textContent = toPersianDigits(movieInfo.movie_title)
            document.getElementById("englishTitle").textContent = removeHTMLEntities(movieInfo.movie_title_en)
            document.getElementById("productDescription").textContent = toPersianDigits(removeHTMLEntities(movieInfo.description))
            document.getElementsByTagName("heroImg").item(0).setAttribute("src", movieInfo.movie_img_b)
            
            document.getElementById("genre1").textContent = movieInfo.category_1
            if (movieInfo.category_2 != null) {
                let genreToAdd = `<text>${movieInfo.category_2}</text>`
                document.getElementById("genreInfo").insertAdjacentHTML('beforeend', genreToAdd)
            }    
            
            let ratingCardNode = document.getElementsByTagName("ratingCard").item(0)
            let rateValue = null
            if (movieInfo.rate_avrage != null) {
                rateValue = Math.max(0, Math.min(5, movieInfo.rate_avrage))
                ratingCardNode.getElementsByTagName("title").item(0).textContent = toPersianDigits(rateValue + " از " + "5")
                ratingCardNode.getElementsByTagName("ratingBadge").item(0).setAttribute("value", rateValue / 5.0)
                ratingCardNode.getElementsByTagName("description").item(0).textContent = toPersianDigits("میانگین از بین " + movieInfo.rate_cnt + " نظر")
            } else {
                ratingCardNode.parentNode.parentNode.parentNode.removeChild(ratingCardNode.parentNode.parentNode)
            }
            
            let infoRowToAdd = `<text>محصول ${movieInfo.country_1}</text>`
            if (movieInfo.produced_year && movieInfo.produced_year > 0) {
                infoRowToAdd += `<text>${toPersianDigits(movieInfo.produced_year)}</text>`
            }
            infoRowToAdd += `<text>${productDuration(movieInfo)}</text>`
            
            if (rateValue) {
                infoRowToAdd += `<ratingBadge value="${rateValue / 5.0}" />`
            }
            
            let imdb = movieInfo.imdb_rate
            if (imdb != null && imdb > 0) {
                infoRowToAdd += `<organizer><badge style="tv-position:center;" srcset="${jsBaseURL}Resources/imdb.png 1x, ${jsBaseURL}Resources/imdb@2x.png 2x" width="45" height="22"/>`
                infoRowToAdd += `<text style="tv-position:trailing; margin-right: 6; tv-text-style:caption2; color: white;">${imdb}</text></organizer>`
            }
            if (movieInfo.hd === 'yes') {
                infoRowToAdd += `<badge src="resource://hd" class="badge" />`
            }
            document.getElementById("infoRow").insertAdjacentHTML('beforeend', infoRowToAdd)
            
            if (movieInfo.is_serial) {
                let seriesURL = legacyBaseURL + '/movieserial/uid/' + movieInfo.uid
                dataLoader._fetchJSONData(documentLoader.prepareURL(seriesURL), null, (dataObj) => {
                    let seriesAllEpisodes = dataObj.movieserial
                    
                    let partNumber = movieInfo.serial_part
                    let filteredItemsBasedOnUID = seriesAllEpisodes.filter( (item) => { return item.uid === movieInfo.uid })
                    let seasonNumber = -1
                    if (filteredItemsBasedOnUID.length > 0) {
                        seasonNumber = filteredItemsBasedOnUID[0].serial_season
                    }
                    
                    let allSeasons = {}
                    seriesAllEpisodes.forEach( (item) => {
                        if (allSeasons[item.serial_season] == undefined) {
                            allSeasons[item.serial_season] = []
                        }
                        allSeasons[item.serial_season].push(item)
                    })
                    
                    let episodesForCurrentSeason = seriesAllEpisodes.filter ( (item) => { return item.serial_season === seasonNumber })
                    
                    let allSeasonsCount = Object.keys(allSeasons).length
                    if (allSeasonsCount == 1) {
                        seasonsButton.parentNode.removeChild(seasonsButton)
                    } else {
                        seasonsButton.getElementsByTagName('title').item(0).textContent = toPersianDigits(allSeasonsCount + " فصل")
                        
                        let dataItem = new DataItem()
                        dataItem.setPropertyPath('allSeasons', allSeasons)
                        seasonsButton['dataItem'] = dataItem
                    }
                    
                    if (episodesForCurrentSeason.length > 0) {
                        let nodesToAdd = `<header>
                        <title>${allSeasonsCount > 1 ? `قسمت‌های فصل ${toPersianDigits(seasonNumber)}` : 'سایر قسمت‌ها'}</title>
                        </header>
                        <section binding="items:{episodes};">
                        </section>`
                        
                        let episodesShelf = document.getElementById("allEpisodes")
                        episodesShelf.dataItem = new DataItem()
                        episodesShelf.dataItem.setPropertyPath("episodes", dataItemsFromJSONItems(episodesForCurrentSeason))
                        episodesShelf.insertAdjacentHTML('beforeend', nodesToAdd)
                    }
                })    
            } else {
                seasonsButton.parentNode.removeChild(seasonsButton)
            }
            
            let recommendationURL = legacyBaseURL + '/recom/uid/' + this._movieUID
            dataLoader._fetchJSONData(documentLoader.prepareURL(recommendationURL), null, (dataObj) => {
                let movies = dataObj.recom
                recommendationSectionNode.dataItem.setPropertyPath("items", dataItemsFromJSONItems(movies))
                
                document.getElementById("recommendationStaticTitle").textContent = "پیشنهادها"
            })
            
            let detailInfoURL = legacyBaseURL + '/moviedetail/uid/' + this._movieUID
            dataLoader._fetchJSONData(documentLoader.prepareURL(detailInfoURL), null, (dataObj) => {
                if (dataObj.moviedetail == null) {
                    return
                }
                
                if (dataObj.moviedetail.trailer && dataObj.moviedetail.trailer.length > 0) {
                    playButton.parentNode.insertBefore(previewButton, bookmarkButton)
                    previewButton.addEventListener('select', (event) => {
                        playTrailer(dataObj.moviedetail.trailer[0])
                    })
                    previewButton.addEventListener('play', (event) => {
                        playTrailer(dataObj.moviedetail.trailer[0])
                    })
                }
                
                if (dataObj.moviedetail.crew && dataObj.moviedetail.crew.length > 0) {
                    let castsSection = castsShelf.getElementsByTagName("section").item(0)
                    castsShelf.getElementsByTagName("title").item(0).textContent = 'عوامل'
                    createLockups(dataObj.moviedetail.crew, castsSection)
                }
                
                function createLockups(crew, castsSection) {
                    let directorNode = document.getElementById("directorInfo")
                    let actors = []
                    for(let i = 0; i < crew.length; i++) {
                        let item = crew[i]
                        item.profile.forEach((profile) => {
                            if (profile.name_fa == null || profile.name_fa === '') {
                                return
                            }
                            if (item.post_info.title_fa == null || item.post_info.title_fa === '') {
                                return
                            }
                            let names = profile.name_fa.split(' ')
                            if (names.length < 2) {
                                return
                            }
                            let lockup = `<monogramLockup productsListDocumentURL="/XMLs/ProductsList.xml">
                            <monogram firstName="${names[0]}" lastName="${names[names.length - 1]}" />
                            <title>${profile.name_fa}</title>
                            <subtitle>${item.post_info.title_fa}</subtitle>
                            </monogramLockup>`
                            
                            if (item.post_info.title_fa === 'کارگردان' && directorNode.textContent === '') {
                                directorNode.textContent = profile.name_fa
                            }
                            
                            if (item.post_info.title_fa.includes('بازیگر')) {
                                actors.push(profile.name_fa)
                            }
                            castsSection.insertAdjacentHTML('beforeend', lockup)
                            
                            let dataItem = new DataItem()
                            if (profile.movies != null && profile.movies !== '') {
                                dataItem.setPropertyPath('requestType', 'castSearch')
                                dataItem.setPropertyPath('searchURL', profile.movies)
                            } else {
                                dataItem.setPropertyPath('requestType', 'search')
                            }
                            dataItem.setPropertyPath('queryString', profile.name_fa)
                            castsSection.lastChild['dataItem'] = dataItem
                        })
                    }
                    if (directorNode.textContent === '') {
                        directorNode.parentNode.parentNode.removeChild(directorNode.parentNode)
                    } else {
                        directorNode.parentNode.getElementsByTagName('title').item(0).textContent = 'کارگردان'
                    }
                    if (actors.length > 0) {
                        let infoNode = `<info>
                        <header>
                        <title>بازیگران</title>
                        </header>`
                        for (let i = 0; i < Math.min(3, actors.length); i++) {
                            infoNode += `<text>${actors[i]}</text>
                            `
                        }
                        infoNode += '</info>'
                        
                        let infoListNode = document.getElementsByTagName('infoList').item(0)
                        infoListNode.insertAdjacentHTML('beforeend', infoNode)
                    }
                }
            })
            
            let reviewsURL = legacyBaseURL + '/commentList/uid/' + this._movieUID + '/perpage/25/'
            dataLoader._fetchJSONData(documentLoader.prepareURL(reviewsURL), null, (dataObj) => {
                let commentList = dataObj.commentlist
                if (commentList && commentList.length > 0) {
                    const reviewsSection = document.getElementById("reviewsSection")
                    commentList.forEach((comment) => {
                        let jalaliDate = t2j(Date.parse(comment.sdate.replace(' ','T')) / 1000, true)
                        let hourSection = comment.sdate.split(' ')[1].substr(0,5)
                        
                        let nodeToAdd = `<reviewCard>
                        <title style="tv-position: top;">${comment.name || comment.username || 'بی نام'}</title>
                        <description style="tv-position: top;">${toPersianDigits(comment.body)}</description>
                        <text style="tv-position: bottom;">${toPersianDigits(jalaliDate + ' ' + hourSection)}</text>
                        </reviewCard>
                        `
                        reviewsSection.insertAdjacentHTML('beforeend', nodeToAdd)
                    })
                }
            })
            
            playButton.addEventListener('select', (event) => {
                handlePlayScenario(movieInfo)
            })
            
            playButton.addEventListener('play', (event) => {
                handlePlayScenario(movieInfo)
            })
            
            document.addEventListener('appear', (event) => {
                if (UserManager.isLoggedIn() && !isLoggedInAtLaunch) {
                    playButton.getElementsByTagName('title').item(0).textContent = 'پخش فیلم'
                }
            })
            
            setupBookmarkButton(movieInfo)
            
            bookmarkButton.addEventListener('select', (event) => {
                handleBookmarkScenario(movieInfo)
            })
            
            bookmarkButton.addEventListener('appear', (event) => {
                setupBookmarkButton(movieInfo)
            })
            
            if (shouldPlay) {
                handlePlayScenario(movieInfo)
            }
        })    
        
        function setupBookmarkButton(movieMoreInfo) {
            if (movieMoreInfo.has_wish) {
                bookmarkButton.getElementsByTagName("badge").item(0).setAttribute('src', 'resource://button-remove')
                bookmarkButton.getElementsByTagName("title").item(0).textContent = 'حذف از نشان‌ها'
            } else {
                bookmarkButton.getElementsByTagName("badge").item(0).setAttribute('src', 'resource://button-add')
                bookmarkButton.getElementsByTagName("title").item(0).textContent = 'افزودن به نشان‌ها'
            }
        }
        
        function handleBookmarkScenario(movieMoreInfo) {
            if (UserManager.isLoggedIn()) {
                if (movieMoreInfo.wish_link && movieMoreInfo.wish_link !== '') {
                    movieMoreInfo.has_wish = !movieMoreInfo.has_wish
                    setupBookmarkButton(movieMoreInfo)
                    
                    let xhr = new XMLHttpRequest()
                    xhr.open("POST", movieMoreInfo.wish_link)
                    xhr.responseType = "json";
                    xhr.onload = () => {
                        let response = xhr.response
                        
                        let success = false
                        if (movieMoreInfo.wish_link.includes('wishadd')) {
                            success = response.wishadd === 'success'
                        } else if (movieMoreInfo.wish_link.includes('wishdel')) {
                            success = response.wishdel === 'success'
                        }
                        if (!success) {
                            movieMoreInfo.has_wish = !movieMoreInfo.has_wish
                            setupBookmarkButton(movieMoreInfo)
                        } else {
                            movieMoreInfo.wish_link = response.link
                            
                            var event = new Event('myListUpdate');
                            document.dispatchEvent(event);
                        }
                    }
                    xhr.onerror = () => {
                        movieMoreInfo.has_wish = !movieMoreInfo.has_wish
                        setupBookmarkButton(movieMoreInfo)
                    }
                    xhr.send()
                } else if (!isLoggedInAtLaunch) {
                    isLoggedInAtLaunch = true
                    dataLoader._fetchJSONData(documentLoader.prepareURL(moreInfoURL), null, (dataObj) => {
                        updateOldInfoWithNew(newMovieInfo, dataObj.movie)
                        handleBookmarkScenario(movieMoreInfo)
                    })
                }
            }
        }
        
        function updateOldInfoWithNew(oldMovieInfo, newMovieInfo) {
            oldMovieInfo.wish_link = newMovieInfo.wish_link
            oldMovieInfo.has_wish = newMovieInfo.has_wish
            oldMovieInfo.watch_permision = newMovieInfo.watch_permision
            oldMovieInfo.watch_action = newMovieInfo.watch_action
            oldMovieInfo.visit_url = newMovieInfo.visit_url
        }
        
        function handlePlayScenario(movieInfo) {
            if (UserManager.isLoggedIn()) {
                if (movieInfo.watch_permision) {
                    playMovie(movieInfo)
                } else {
                    if (!isLoggedInAtLaunch) {
                        isLoggedInAtLaunch = true
                        dataLoader._fetchJSONData(documentLoader.prepareURL(moreInfoURL), null, (dataObj) => {
                            updateOldInfoWithNew(movieInfo, dataObj.movie)
                            handlePlayScenario(movieInfo)
                        })
                    }
                }
            }
        }
        
        function createSkipIntroDocument() {        
            const template = `<?xml version="1.0" encoding="UTF-8" ?>
            <document>
                <head>
                    <style>
                        .skipButton {
                            tv-align: center;
                            tv-position: bottom;
                            tv-text-style: body;
                            margin: 0 20 200 20;
                            padding: 0 20 0 20;
                        }
                    </style>
                </head>
                <divTemplate>
                    <button id="skipButton" class="skipButton">
                        <text>رد کردن تیتراژ</text>
                    </button>
                </divTemplate>
            </document>
            `;
            return new DOMParser().parseFromString(template, "application/xml");
        }

        function playMovie(movieFullInfo) {
            if (movieFullInfo == null) {
                return
            }
            if (movieFullInfo.watch_permision) {
                if (movieFullInfo.watch_action.movie_src && movieFullInfo.watch_action.movie_src !== "") {
                    
                    var player = new Player()
                    var video = new MediaItem('video', movieFullInfo.watch_action.movie_src)
                    video.title = toPersianDigits(movieFullInfo.movie_title)
                    video.description = toPersianDigits(movieFullInfo.description)
                    video.resumeTime = movieFullInfo.watch_action.last_watch_position
                    video.artworkImageURL = movieFullInfo.movie_img_b
                    
                    let castSkip = movieFullInfo.cast_skip_arr
                    if (castSkip != null && castSkip.intro_e > 0 && video.resumeTime + 5 < castSkip.intro_e) {
                        let skipIntroDocument = createSkipIntroDocument()
                        skipIntroDocument.getElementById('skipButton').addEventListener('select', (event) => {
                            player.seekToTime(castSkip.intro_e)
                            player.interactiveOverlayDocument = null
                        })
                        player.resumeTime = 0
                        player.interactiveOverlayDocument = skipIntroDocument
                        player.interactiveOverlayDismissable = true
                    }

                    player.playlist = new Playlist()
                    player.playlist.push(video)
                    
                    setPlaybackEventListeners(player, movieFullInfo)
                    
                    player.play()
                }    
            }
        }
        
        function playTrailer(movieTrailer) {
            if (movieTrailer == null) {
                return
            }
            var player = new Player()
            var video = new MediaItem('video', movieTrailer.file_link)
            video.title = movieTrailer.title
            video.artworkImageURL = movieTrailer.thumb
            
            player.playlist = new Playlist()
            player.playlist.push(video)
            
            player.play()
        }
        
        function setPlaybackEventListeners(currentPlayer, movie) {
            if (movie.visit_url.formAction == null) {
                return
            }
            
            let elapsedTime = 0
            let formAction = movie.visit_url.formAction
            let frmID = movie.visit_url["frm-id"]
            
            currentPlayer.addEventListener("stateDidChange", function(event) {
                if (event.state === 'end') {
                    movie.watch_action.last_watch_position = elapsedTime                    
                }
            });
            
            currentPlayer.addEventListener("timeDidChange", function(event) {
                elapsedTime = Math.floor(event.time)
                postWatchTime()
            }, { interval: movie.visit_url.visitCallPeriod });
            
            function postWatchTime() {
                if (elapsedTime < movie.visit_url.visitCallPeriod) {
                    return
                }
                let xhr = new XMLHttpRequest()
                xhr.open("POST", formAction)
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.responseType = 'json'
                xhr.onload = () => {
                    if (xhr.response.visitpost) {
                        formAction = xhr.response.visitpost.formAction
                        frmID = xhr.response.visitpost['frm-id'] || frmID
                    }
                }
                xhr.onerror = () => {
                }
                
                if (frmID === undefined) {
                    return
                }
                let payload = `frm-id=${frmID}&movie_id=${movie.uid}&movie_type=${movie.is_serial ? 'serial' : 'film'}&`
                payload += 'data[user_stat]='
                
                let stat = "["
                
                let count = movie.visit_url.visitCallPeriod / 10
                for (let i = 0; i < count; i++) {
                    stat += `{"current_buffer_length":0,"current_player_time":${Math.max(0, elapsedTime - 10 * (count - (i + 1)))},"playing_buffer_time":0,"current_state":"playing","player_type":"tvos","counter":${i * 10 + 10}},`
                }
                stat = stat.slice(0, -1) + ']'
                payload += stat
                
                xhr.send(payload)
            }
        }
        
        function productDuration(productInfo) {
            let durationHour = parseInt(productInfo.duration / 60 + "", 10)
            let durationMinute = parseInt(productInfo.duration % 60 + "", 10)
            let duration = ""
            if (durationHour > 0) {
                duration += durationHour + " ساعت"
            }
            if (durationMinute > 0) {
                if (duration !== "") {
                    duration += " و "
                }
                duration += durationMinute + " دقیقه"
            }
            return toPersianDigits(duration)
        }    
        
        
        function dataItemsFromJSONItems(items) {
            return items.filter((movie) => { return movie.uid != null }).map((movie) => {
                let dataItem = new DataItem("similarArtwork", movie.uid)
                Object.keys(movie).forEach((key) => {
                    let value = movie[key]
                    if (value && key === 'user_watched_info') {
                        let percent = value['percent']
                        if (percent) {
                            dataItem.setPropertyPath('watch_fraction', percent / 100.0)
                        } else {
                            dataItem.setPropertyPath('watch_fraction', 0.0)
                        }
                    }
                    if (key === 'movie_title' || key === 'descr') {
                        value = toPersianDigits(value)
                    }
                    if (key === 'movie_title_en') {
                        value = removeHTMLEntities(value)
                    }
                    dataItem.setPropertyPath(key, value)
                })
                return dataItem
            })
        }
    }
    
    handleEvent(event) {
        if (UserManager.isLoggedIn() &&
        (event.target.getAttribute("id") === "playButton" || 
        event.target.getAttribute("id") === "bookmarkButton" ||
        event.target.getAttribute("id") === "previewButton")) {
            return
        }
        super.handleEvent(event)
    }
}

ProductDocumentController.preventLoadingDocument = true
registerAttributeName("productDocumentURL", ProductDocumentController)
