# Introduction

Goal is to add metrical tags to texts by appending more information to existing tags.

In order to do this in an automated fashion, we take advantage of Prosodic, a metrical-phonological parser written in Python.


# New tags

Current words look like ``droghte{*droughte@n*}``
New information is added with ``#`` and looks like ``wonder@n#Su``.

Per syllable tags:
* S stressed
* u unstressed
* e unsounded e
* E sounded e
* el an elided ending
* ele a elided ending

The current raw text format with tags looks like:
```
ich@pron%nom haven@v%pr_1 gret@adj wonder@n bi@prep this@gram_adj light@n
```

It should become:

```
ich@pron%nom#u haven@v%pr_1#S gret@adj#ue wonder@n#Su bi@prep#S this@gram_ad#u light@n#Se
```


Example from The Book of the Duchess showing the new tags.

```
1	I have gret wonder, by this lighte,	 
	u S ue Su S u Se

2	How that I live, for day ne nighte
	u S u Se u S u Se	


3	I may nat slepe wel nigh noght;
	u S u SE S u S
4	I have so many an idel thoght
	u S u Sel elu Su S	
5	Purely for defaulte of slepe,		 
	Su S uSel u Se
```


# Using Prosodic

As a normal user:
* pip install --user prosodic
* dnf install espeak

Run prosodic with ./.local/bin/prosodic to start a CLI. See [https://github.com/quadrismegistus/prosodic] for documentation. In order to run Prosidc on the texts, you will need to extract the raw words.

To play without it try something like:
```
/paste
I may nat slepe wel nigh noght;
Control-d

/parse

/scan
/report
/tree

```

If you want access to the bare text, you can export it using gcme-tool. Assuming its been built, you can run something like:
```
java -jar target/gcme-tool-0.0.1-SNAPSHOT-shaded.jar ../data export-text text-output-dir
```

You will see the data/texts structure recreated, but all the files will just have bare words.

# Automated tagging

The add_tags.py script uses Prosodic to guess what the new tags should be.

Run like
```
python add_tags.py testdata/chaucer.txt result
```

It transforms the our raw text format specified by the first file by adding the new tags and writes the result to the second file.








