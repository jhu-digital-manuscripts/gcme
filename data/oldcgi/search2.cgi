#!/usr/local/bin/perl

use CGI qw(:all);
$qs=new CGI;

BEGIN {
   use CGI::Carp qw(fatalsToBrowser);  
}


#################################################
##### 			Define Global Variables and Constants
#####

#path specific variables
$basedir = "/~chaucer/tools";
$locations_file = "./abbr2file.txt";
$text_dir = "./texts/";
$titles_file = "./file2title.txt";
$expansions_file = "./expansions.txt";


$no_of_hits = 0;
#$begin_red = "<FONT COLOR=\"#cd2626\"><B>";
$begin_red = "<FONT COLOR=\"red\"><B>";
$end_red = "</FONT></B>";
$results_tag = "";
$target = "";

@search_locales = ();
@anchors = ();

%file2title = ();
%LBtags = ();
%LBtexts = ();
%html = ();
%locations = ();
%search_results = ();
%temp_results = ();

$tpath = $qs->param('path');
($text_path, $target) = split/\#/, $tpath, 2;

$ttl = $qs->param('ttl');

@sep_list = ( 0, 1, 2, 9, 12, 13, 14);
$separation = $qs->param('separation');


##  Define the state of this transaction
if ($qs->param('state')) {
	$state=$qs->param('state');
} else {
	$state="new";
}



#################################################
#####                            			      MAIN                          		            #####
#################################################


# if criteria tags are editable then don't read cookie and get all info from form
if ( ($prefs{'display'} eq "editable_lbml") && ($state eq "search") ) {
	@words1= $qs->param('ed_words');
	foreach $i (@words1) { $LBtags{$i} = $i; }
	@texts1 = $qs->param('ed_texts');
	foreach $j (@texts1) { $LBtexts{$j} = $j; }
	
	$prefs{'separation'} = $qs->param('separation');
	$prefs{'text_display'} = $qs->param('text_display');
} else {
	&read_cookie;
	if ($prefs{'separation'} ne $separation) {
			$prefs{'separation'} = $separation;
	}
}

&set_cookie;

&html_header;

##############################            trouble shooting
#foreach $temp3 (sort keys %LBtags) {
#	print "$LBtags{$temp3}<br>";
#}
#foreach $temp4 (sort keys %LBtexts) {
#	print "$LBtexts{$temp4}<br>";
#}
#print "$prefs{'display'}<br>";
#print "$prefs{'no_of_lists'}<br>";
#print "$prefs{'text_display'}<br>";


if ($state eq "search") {
	&search_texts;
	&print_results;
} elsif  ($state eq "read") {
	&read_text_file;
	&print_html;
}

&html_footer;



#################################################
#####                     		             SUBROUTINES            	             	 	   #####
#################################################
sub search_texts {
	&determine_text_location;
	&search_locations;
}



sub search_locations {
	foreach $lcl (@search_locales) {
		next if ($lcl eq "");
	
		$locale = $text_dir . $lcl;
		
		foreach $tag (sort keys %LBtags) {
			# use system command to locate which files contain tag.
			@results = `grep -l $tag $locale`;
			
			&get_lines($tag, @results);
		}		
	}
	if ($separation > 10) {
		my $line_sep = $separation - 10;
		&compare_line_nos($line_sep, $results_tag);
	} else {
		%search_results = %temp_results;
	}
}


sub compare_line_nos {
	my ($line_sep, $results_tag) = @_;
	$no_of_hits = 0;
	
	$results_tag = "Search results for";
	$results_tag = &make_results_tag($results_tag);
	
	foreach $tag1 (sort keys  %temp_results) {
	
		foreach $tag2 (sort keys  %temp_results) {
			next if ($tag1 eq $tag2);
			
			foreach $file (sort keys %{$temp_results{$tag1}}) {
				foreach $ln_no1 (sort keys %{$temp_results{$tag1}{$file}}) {
					
					foreach  $ln_no2 (sort keys %{$temp_results{$tag2}{$file}}) {
						if (abs($ln_no2 - $ln_no1) <= $line_sep) {
							if ($ln_no2 < $ln_no1) {
								&format_multi_line_results($file, $results_tag, $tag2, $tag1, $ln_no2, $ln_no1);
							} else {
								&format_multi_line_results($file, $results_tag, $tag1, $tag2, $ln_no1, $ln_no2);
							}
						}
					}
				}
			}
		}
	}
	$no_of_hits /= 2;
}


sub format_multi_line_results {
		my ($file, $results_tag, $tag1, $tag2, $ln_no1, $ln_no2) = @_;
		
		$no_of_hits++;
		
		$positive = "";
		
		if ($ln_no1 == $ln_no2) {
			$line_nos = $ln_no1; 
		} else { 
			$line_nos = $ln_no1 . "-" . $ln_no2;
		}
		
		$positive = $temp_results{$tag1}{$file}{$ln_no1};
		if ($ln_no1 != $ln_no2) {
			$positive .= " <b>...</b> " . $temp_results{$tag2}{$file}{$ln_no2};
		}
		
		# build a hash:   tag sought-for -- filename -- line no -- actual text
		$search_results{$results_tag}{$file}{$line_nos} = $positive;	
}



sub get_lines {
	my ($tag, @results) = @_;
	
	# get the lines in which the tag appears
	# --- $thing, e.g, "./texts/ch/01/ch-1-01.cat"
	foreach $thing (@results) {
		chomp($thing);
		
# make sure that partial tags aren't found in searches 
# e.g,  a search for "{*king@n*}" will not return "{*cloth-making@n*}".
# PROBLEM: syntactic searches (.e.g., "...@pn")
		
		# use system command to locate lines in files contain tag.
		@tag_found_in_lines = `grep -h $tag $thing`;
			
		#remove "./texts/" from beginning of filename
		$thing =~ s/$text_dir//g;
		
		$results_tag = "Search results for";

		if ( ($separation < 10) && ($separation > 0) ) {
			#grep out any line that doesn't contain all tags
			foreach $tag2 (sort keys %LBtags) {
				@tag_found_in_lines = grep /$tag2/, @tag_found_in_lines;
			}
			
			$results_tag = &make_results_tag($results_tag);
			
		} elsif (  ($separation == 0) && ($prefs{'no_of_lists'} eq "single")  ) {
		
			$results_tag = &make_results_tag($results_tag);
			
		} else {
			$myLabel = &lbml2human($tag);
			$results_tag .= " \"" . $myLabel . "\"";
		}
			
		 foreach $i (@tag_found_in_lines) {
		 	chomp ($i);
		 	&format_temp_results($thing, $results_tag, $i);
		}
	}
}



sub format_temp_results {
	my ($thing, $tag, $i) = @_;
	
	# increment total number of hits
	if (!$temp_results{$tag}{$thing}{$line_no}) {
		$no_of_hits ++;
	}
	
	# remove all LBML tags (e.g., {* ben@v%ppl*} )
	$i =~ s/{[^}]*}/\ /g;
	
	# remove file name from each line
	($drek, $i) = split/ /, $i, 2;

	my ($line_no, $line) = split/ /, $i, 2;
	
	
	# build a hash:   tag sought-for -- filename -- line no -- actual text
	$temp_results{$tag}{$thing}{$line_no} = $line;
}


sub determine_text_location {
	&read_file_locale;
	foreach $file (sort keys %LBtexts) {
		push @search_locales, @{$locations{$file}};
	}
}



sub lbml2human {
	# USE:  $tag = &lbml2human($item);
	my ($item) = @_;
		
	@parts= split /\@/, $item, 2;
				
	# expand abbreviations for human readability
	&read_file($expansions_file);
	if ($expansions{$parts[1]}) { 
		$parts[1] = $expansions{$parts[1]};
	} else {
		@partletts= split /\_/, $parts[1], -1;
		$parts[1] = "";
		foreach $itemlett (@partletts) {
			if ($expansions{$itemlett}) { 
				$parts[1] .= $expansions{$itemlett} . " ";
			} else {
				$parts[1] .= $itemlett;
			}
		}
	}
	$myTag = "$parts[0]:  $parts[1]";
}


sub make_results_tag {
	my($results_tag) = @_;
	my @tWords = (sort keys %LBtags);
	
	foreach $tag0 (@tWords) {
		if (   ($#tWords != 0) && ($tag0 eq $tWords[$#tWords])   ) {
			$results_tag .= " and";
		}
		my ($word, $title) = split/:/, $LBtags{$tag0}, 2;
		$results_tag .= " \"$word\"";
		if (   ($tag0 ne $tWords[$#tWords-1]) && ($tag0 ne $tWords[$#tWords])   ) {
			$results_tag .= ",";
		}
	}
	return($results_tag);
}




#################################################
#####                     	          PRINTING  SUBROUTINES            	    	 	    #####

sub print_results {
	&read_titles;
	&print_results_header;
	
	foreach $tag (sort keys %search_results) {
	
		# TEMPORARY SOLUTION for the exclusion of pathnames
		next if ($tag =~ /^ch\//);
	
		print "\n<DL>\n<b>$tag</b>\n";
		foreach $file (sort keys %{$search_results{$tag}}) {
			chomp($file);
			
			$this_title = $file2title{$file};
			$my_ttl = $this_title;
			$my_ttl =~ s/ /%20/g;
			
			print "<DT>&nbsp;" .
				"<A HREF=\"search.cgi?state=read&ttl=$my_ttl&path=$file\"" .
				"\nTARGET=\"$file\"><em>" .
				$this_title . 
				"</em></A></DT>\n";
			
			 #sort by line number and make table
			foreach $ln_no (sort {$a<=>$b} keys %{$search_results{$tag}{$file}}) {
				$ln_txt = $search_results{$tag}{$file}{$ln_no};
				
				print "\t<DD>" .
					"<FONT SIZE=\"-1\"><b>$ln_no</b> ";
					
				if ($separation > 10) { ($ln_no, $drek) = split/-/, $ln_no; }
				
				print "<A HREF=\"search.cgi?state=read&ttl=$my_ttl&path=$file";
				if ($prefs{'text_display'} != 0) {  print "\%23$ln_no";  }
				print "\#$ln_no\"\n\tTARGET=\"$file\">" .
					$ln_txt . 
					"</A></FONT></DD>\n";
			}
		}
		print "</DL>\n";	
	}
}



sub print_results_header {
	print "<TABLE WIDTH=\"100%\" BORDER=0>\n" .
		"<TR BGCOLOR=\"#6699cc\" VALIGN=\"top\" ALIGN=\"right\"><TD>\n" .
		"<font size=\"-1\">Total&nbsp;Hits:&nbsp;$no_of_hits</font>\n" .
		"<IMG SRC=\"$basedir/images/results.gif\" ALIGN=\"left\">\n" .
		"</TD></TR></TABLE>\n";
}


sub print_html {
	$results_tag = "";
	$results_tag  = &make_results_tag($results_tag);
	$no_anchors = $#anchors + 1;
	
	print "\n<h2>$ttl</h2>\n<HR>\n";
	
	#if there is an anchor then display the amount of text set in prefs
	if (  $target && ($prefs{'text_display'} != 0)  ) {
		# number of lines to be displayed on each side of the link
		$noltbdoes = $prefs{'text_display'}/2;
		$begin_print = $target - $noltbdoes;
		$end_print = $target + $noltbdoes;
	}
	
	
	# add links to line numbers with sought-for words at top of page
	print "There are $no_anchors lines in <em>$ttl</em> which contain $results_tag";
	
	if ($target) {
		print ".<br>The following line numbers are contained in this selection:&nbsp; ";
	} else {
		print ":&nbsp;";
	}
	
	foreach $line (@anchors) {
 		if (  $target && ($prefs{'text_display'} != 0)  ) {
			next if ( ($line < $begin_print) ||  ($line > $end_print) );
 		}
		print "<A HREF=\"#$line\">$line</A>&nbsp; ";
	}
	print "\n\n<HR>\n<P>";
	print "\n\n<TABLE BORDER=0>";
	
 	#sort by line number and make table
 	foreach $ln (sort {$a<=>$b} keys %html) {
 		if (  $target && ($prefs{'text_display'} != 0)  ) {
			next if ( ($ln < $begin_print) ||  ($ln > $end_print) );
 		}
 		print "<TR>\n\t<TH ALIGN =\"right\">";
 		
 		#create anchors to link to from at top of page
 		foreach $line (@anchors) {
 			if (     ($ln == ($line - 6))  ||  (  (($line-6) < 0) && ($ln == 1)  )    ) {
 				print "<A NAME=\"$line\"></A>";
 			}
 		}

		print "$ln&nbsp;</TH>\n\t<TD>$html{$ln}</TD>\n</TR>\n";
	}
	
	print "</TABLE>";
}





#################################################
#####                     	          	I/O  SUBROUTINES            	    	 	    	   #####

sub read_file_locale {
	open LOCALE, "<$locations_file"  
					|| die "can't open file: $locations_file\n";
		while (<LOCALE>) {
			chomp;
			
			# skip comments
			next if ($_ =~ /^#/ );

			($key, $location) = split /,/, $_, 2;
			
			push @{$locations{$key}}, $location;
			
		}
	close LOCALE;
}

sub read_text_file {
	
	open FILE, "<$text_dir$text_path"  
					|| die "can't open file: $text_dir$txt_path\n";
		while (<FILE>) {
			chomp;
			# remove blank lines
			next if ($_ eq "");
			
			my $anch = 0;
			
			# remove file name from each line
			($drek, $_) = split/ /, $_, 2;
			
			# mark the sought-for words in red
			foreach $tag (sort keys %LBtags) {
				$anch .= s/\s([^\{]*){\*$tag[^\{]*}/ $begin_red$1$end_red/g;
			}
			
			# remove all LBML tags (e.g., {* ben@v%ppl*} )
			s/{[^}]*}//g;
			
			($line_no, $line) = split/\ /, $_, 2;
			
			# add line number to list of anchors for document
			if ($anch) { push @anchors, $line_no; }
			
			$html{$line_no} = $line;
		}
	close FILE;
}


sub read_titles {
	open TITLES, "<$titles_file";
		while (<TITLES>) {
			chomp;
			
			# skip comments
			next if ($_ =~ /^#/ );

			($file1, $title1) = split/\t/, $_, 2;
			
			$file2title{$file1} = $title1;
		}
	close TITLES;
}


sub read_file {
	my ($file) = @_;
	open EXPAN, "<$file"  
					|| die "can't open file: $file\n";
		while (<EXPAN>) {
			chomp;
			($key1, $word1) = split /\t/, $_, 2;
			$expansions{$key1} = $word1;
		}
	close EXPAN;
}





#################################################
#####                     	          COOKIE  SUBROUTINES            	    	 	    #####

sub read_cookie {
	# read old cookies
	if ($qs->cookie()) {
		%LBtags = $qs->cookie(-name=>'words');
		%LBtexts = $qs->cookie(-name=>'texts');
		%prefs = $qs->cookie(-name=>'prefs');
	}
}

sub set_cookie {
	#set cookies 1, 2, and 3
	$cookie1 = $qs->cookie(-name=>'words', -value=>\%LBtags);
	$cookie2 = $qs->cookie(-name=>'texts', -value=>\%LBtexts);
	$cookie3 = $qs->cookie(-name=>'prefs', -value=>\%prefs);
	print $qs->header(-cookie=>[$cookie1, $cookie2, $cookie3]);
}




#################################################
#####                     	       		   HTML  SUBROUTINES            	    	 	    #####


sub html_header {
	print "<HEAD></HEAD>\n";
	print "<BODY bgcolor=\"#ffffff\">\n";

}

sub html_footer {
	print "\n</BODY></HTML>\n";
}
