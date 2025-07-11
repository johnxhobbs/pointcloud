if(FALSE){

library(data.table)

bin = readBin('AMTGRP5000--20140805012250m-finalchunk.zfs', 'raw', n=1e6)

# Timestamp

rowheader = bin[1:40]

rowheader

dat = matrix(bin[-(1:40)], ncol=14, byrow = TRUE)

head(dat)
image(dat |> as.integer() |> matrix(ncol=14) )


bin = readBin('AMTGRP5000--20140805012250m.zfs', 'raw', n=1e8)
length(bin)

fileheader = bin[1:(0x4000 - 1)]
fileheader |> length()
bin = bin[-(0:0x4000)]

# Cut into 71720 chunks
cut(bin, breaks = seq(1,10,3))

dat = split(bin, rep(1:(length(bin) / 71720), each = 71720))

rowheaders = lapply(dat, function(x) x[1:40] )
rowheaders = matrix(rowheaders |> unlist(), ncol=40, byrow=TRUE)
image(rowheaders |> as.integer() |> matrix(ncol=40) )

# First two chunks
t1 = dat[1:2] |> lapply(function(x) x[-(1:40)] ) |> unlist() |> matrix(ncol=14, byrow=TRUE)
image(t1 |> as.integer() |> matrix(ncol=14) )
abline(v=0.5)

# Read in:
# - 2 byte (little endian) int

dt = data.table(V1 = t1[, 1:2] |> t() |> readBin('int', size = 2, n = nrow(t1), signed = FALSE, endian = "little"),
           V2 = t1[, 4:5] |> t() |> readBin('int', size = 2, n = nrow(t1), signed = FALSE, endian = "little"),
           V3 = t1[, 8:10] |> t() |> readBin('int', size = 2, n = nrow(t1), signed = FALSE, endian = "little"),
           V4 = t1[, 11:12] |> t() |> readBin('int', size = 2, n = nrow(t1), signed = FALSE, endian = "little"))

dt[, LINE := rep(1:2, each=.N/2)]

dt[, ANG := ((.I/5120)%%1) * 2*pi]
dt[, DIST := runmed(V1,k=3)]

dt[, image(as.matrix(.SD), col=heat.colors(100))]

dt[, plot(.I%%5120, V1, 'l')]
dt[, plot(DIST*sin(ANG), -DIST*cos(ANG), 'l', asp=1)]

dt[1:1000,matplot(as.matrix(.SD), type='l')]


# Get all of the V2 and V4
t2 = CJ(LINE=1:732, I=1:5120)
t2[, IXD := (LINE-1)*71680 + 40 + (I-1)*14 + 1 ]
t2$V2 = readBin(bin[sort(c(t2$IXD, t2$IXD+1))], 'int', size = 2, n = 1e7, signed = FALSE, endian = "little")

m = dcast(t2, LINE ~ I)
m[1:100, image(as.matrix(.SD))]


res = read_zfs('AMTGRP5000--20140805012250m.zfs')
res[[1]] |> as.integer() |> matrix(ncol=40) |> image()

res[[2]] |> dim()
res[[2]][1:720,1:10] |> image()

res[[5]][1:5,1:5120] |> image()

rf = res[[3]] |> log()
rf = (max(rf)-rf) / max(rf)
plot.new()
rf |> as.raster() |> rasterImage(0, 0, 1, 1)

plot.new()
as.raster(res[[2]] / max(res[[2]])) |> rasterImage(0, 0, 1, 1)
as.raster(res[[3]] / max(res[[3]])) |> rasterImage(0, 0, 1, 1)
as.raster(res[[4]] / max(res[[4]])) |> rasterImage(0, 0, 1, 1)
as.raster(res[[5]] / max(res[[5]])) |> rasterImage(0, 0, 1, 1)

d = res[[2]]
ang = 2*pi*(1:ncol(d))/ncol(d)
x = sweep(res[[2]], 2, sin(ang), `*`)
y = sweep(res[[2]], 2, cos(ang), `*`)

plot(x[1:10,], -y[1:10,], 'l', asp=1)
i = sample(length(x),1e5)
plot(x[i], -y[i], pch='.', asp=1, col='#00000040', xlim=c(-2e4,2e4), ylim=c(-2e4,2e4))
plot(x[i], -y[i], pch='.', asp=1, col='#00000040', xlim=c(-1e4,1e4), ylim=c(-1e4,1e4))
paletteknife::autoaxis(3);paletteknife::autoaxis(4)

abline(v=c(-8400,5400), col='red'); diff(c(-8400,5400))

# 5120*720*4bytes = 14.7 MB tiff image
# This reduces to 10 MB with deflate compression
# At 1cm sampling - 2GB per KM ==> 2,000 GB for entire LU
# Max size per TIFF is 4GB (32 bit indexing) --> save 100m files = 200MB
# No compression for very fast opening? Combine 14 small files together






}