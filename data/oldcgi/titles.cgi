#! /usr/local/bin/perl

use CGI::Pretty qw(:all);

BEGIN {
   use CGI::Carp qw(fatalsToBrowser);  
}


#################################################
#####             Define Global Variables and Constants
#####
$imagepath = "/~chaucer/tools/images";
$dir = ".";
$filename = "abbr2title.lut";
@author = ("Geoffrey Chaucer", "John Gower");
$target = "";
$text_data = {};
$poet = "";
$selected_text = "";
$form_action = "/~chaucer/cgi-bin/tools.cgi";



#################################################
#####                MAIN                   #####
#################################################

##  Define the state of this transaction
$state = param('state') || 'new';


## Evaluate the state and proceed appropriately
if ($state eq "new") {
	## produce list of texts to be searched
	%text_data = &read_file($dir, $filename);
	$title_html = &compose_first_titles_html;
	
	print header, 
		start_html,
		start_form(-action=>$form_action, 
				-method=>'POST', 
# 				-enctype=>'multipart/form-data',
				-target=>'criteria'),
			hidden(-name=>'state', -value=>'add_texts'),
			hidden(-name=>'layer', -value=>'top'),
			$title_html,
		end_form,
		end_html;
} elsif ($state eq "subset") {
	## pop up a subset of the selected document
	&which_texts;
	$list_html = &compose_subset_titles_html;
	
	print header,
		start_html,
		start_form(-action=>$form_action, 
				-method=>'POST', 
# 				-enctype=>'multipart/form-data',
				-target=>'criteria'),
			hidden(-name=>'state', -value=>'add_texts'),
			hidden(-name=>'layer', -value=>'sub'),
			$list_html,
		end_form,
		end_html;
} elsif ($state eq "addtext") {
	## add selected files to search for
}



#################################################
#####               SUBROUTINES            	#####
#################################################


## subroutine reads in the file of titles and abbreviations that can be searched.
sub read_file {
	my ($dir, $filename) = @_;
	
	open TITLES, "<$dir/$filename"  
					|| die "can't open titles and abbreviations: $filename\n";
		while (<TITLES>) {
			chomp;
			# skip comments
			next if ($_ =~ /^##/ );			
			($keys, $data) = split /\-/, $_, 2;
			($key0, $key1, $key2, $key3) = split /\./, $keys;
			# load hashes
			$text_data{$author[$key0]}{$key1}{$key2}{$key3} = $data;
		}
	close TITLES;
	return %text_data;
}


## Load the titles and look-up codes into a series of hashes
sub which_texts {
	@main_texts = qw(CT   Minor   Bo   Tr   LGW   Short   Ast   PNAtCitM
					    WAtC   CA   Peace);
	$text_no = 0;
	
	foreach $i (@main_texts) {
		$checked = param("$i");
		if ($checked) {
			$selected_text = $text_no;
			last;
		}
		$text_no++;
	}
	if ( ($selected_text == 9) || ($selected_text == 10) ) {
		$poet = $author[1]; 		## i.e., John Gower
		$selected_text -= 9;
	} else {
		$poet = $author[0];		## i.e., Geoffrey Chaucer
	}
}


## subroutine creates the HTML for various subsets of Chaucer's and Gowers works.
## The user can then select a portion of the entire work to be searched.
sub compose_subset_titles_html {
	my $start = "\n<DL>";
	my $end= "\n</DL>\n\n";
	my $starttag = "\n\t<dd>";
	my $endtag = "</dd>";
	my $box = "<INPUT TYPE=\"checkbox\" NAME=\"newtexts\" VALUE=\"";

	my $list_html =  "";

	%text_data = &read_file($dir, $filename);
	
	## create header for either Chaucer or Gower
	($abbrev, $title) = split /\,/, $text_data{$poet}{$selected_text}{0}{0}, 2;		
	$list_html .=  "\n<h3>" . $poet . "\'s <em>" . $title . "</em></h3>" . $start;
	
	foreach $key0 (sort keys %{$text_data{$poet}{$selected_text}}) {
		if ($key0 == 0) {
			$starttag = "\n<dt>";
			$endtag = "</dt>";
		}
		##create checkboxes for texts
		foreach $key1 (sort keys %{$text_data{$poet}{$selected_text}{$key0}}) {
			if ($key1 == 0) {
				$starttag = "\n<dt>";
				$endtag = "</dt>";
			}
			## find appropriate title and abbreviation
			($abbrev, $title) = split /\,/, $text_data{$poet}{$selected_text}{$key0}{$key1}, 2;
		 	$list_html .= $starttag . $box . $abbrev . ":" . $title . "\">" . $title . $endtag;
			$starttag = "\n\t<dd>";
			$endtag = "</dd>";
		 }
	}
	$list_html .= $end;
	return $list_html;
}


## create the HTML for the first time in
## The user is presented with a list a of Chaucer's and Gower's works.
##  He or she can either select to have the entire work searched or click on the 
## magifying glass to select a portion of that work.
sub compose_first_titles_html {
	my $start = "\n";
	my $box = "\n\t<INPUT TYPE=\"checkbox\" NAME=\"newtexts\" VALUE=\"";
	my $end= "\n\n\n";
	my $link = "<A HREF=\"titles.cgi?state=subset&";
	my $list_html =  "";

	foreach $key0 (sort keys %text_data) {
		## create header for either Chaucer or Gower
		$list_html .=  "\n<P>\n<B><font size=\"+1\">" . $key0 . "</font></B><BR>" . $start;
		$list_html .= "<font size=\"-1\">&nbsp;&nbsp;&nbsp;&nbsp;select<BR>\n";
		$list_html .= "&nbsp;all&nbsp;subset</font><BR>\n";
		##create checkboxes for texts with selection icon for selecting a 
		## subset of the entire work
		foreach $key1 (sort keys %{$text_data{$key0}}) {
			## find appropriate title and abbreviation
			($abbrev, $title) = split /\,/, $text_data{$key0}{$key1}{0}{0}, 2;
# 			$title =~ s/\ /_/g;
		 	$list_html .= $box . $abbrev . ":" . $title . "\">";
			$list_html .= $link . $abbrev . "=checked\">";
			 $list_html .= "<IMG SRC=\"$imagepath/closeup.gif\" BORDER=0></A>";
			 $list_html .="&nbsp;&nbsp;". $title . "<BR>\n";
		}
		$list_html .= $end;
	}
	return $list_html;
}

sub html_header {
	print "<HEAD></HEAD><BODY bgcolor=\"#ffffff\">\n";
	print "<FORM ACTION=\"/~chaucer/cgi-bin/tools.cgi\" METHOD=POST TARGET=\"criteria\">\n";
	print "<INPUT TYPE=\"hidden\" NAME=\"state\" VALUE=\"add_texts\">";
}

sub html_footer {
	print "</FORM>\n</BODY></HTML>\n";
}
