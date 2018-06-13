#!/usr/local/bin/perl

use CGI qw(:all);
use Data::Dumper;

$qs = new CGI;
@foo = $qs->keywords;
warn Dumper(\@foo);
# 
# BEGIN {
#    use CGI::Carp qw(fatalsToBrowser);  
# }

#################################################
##### 			Define Global Variables and Constants
#####

#path specific variables
$basedir = "/~chaucer/tools";

$chaucer_dict = "./texts/ch/dict/ch-all.spl";
$gower_dict = "./texts/gow/dict/gow-all.spl";
$anon_dict = "./texts/anon/ch/dict/ap-all.spl";
$OED = "./texts/ch/dict/ch-all.lem";
$expansions_file = "./expansions.txt";
$pos_file = "./pos.txt";


$dict_html = "";
$frame = "";

$reload_search = 0;

@new_words = ();
@new_texts = ();
@expan_val = ();

%dict_data = ();
%expansions = ();
%expan_lab = ();
%LBtexts = ();
%LBtags = ();

@sep_list = ( 0, 1, 2, 9, 12, 13, 14 );
%sep_hash = ( 
		0 => "all occurrences", 			1 => "next to each other", 
		2 => "with one word inbetween",
		9 => "found in same line", 			12=> "found within two lines", 
		13 => "found within three lines", 	14=> "found within four lines"
		);

$word = param('word');
$dictionary = param('dictionary');
$layer = param('layer');
$tool = param('tool');
$text_display = param('text_display');

$user_agent = index $ENV{'HTTP_USER_AGENT'}, "Mozilla/2";

&read_cookie;


##  Define the state of this transaction
$state = param('state') || 'new';




#################################################
#####                            			      MAIN                          		            #####
#################################################


## Evaluate the state and proceed appropriately
if ($state eq "new") {
	&show_dict;
} elsif ($state eq "change_tool") {
	if ($tool eq "pos") {
		&show_pos;
	} else {
		&show_dict;
	}
} elsif ($state eq "lookup") {
	&show_lookup;	
} elsif ($state eq "add") {
	$frame="tool";
	&show_add;
} elsif ($state eq "New Search") {
	&new_search;
} elsif ($state eq "cl") {
	&remove_item;
} elsif ($state eq "add_texts") {
	$frame="texts";
	&show_add;
} elsif ($state eq "pop_prefs") {
	print header;
	&print_prefs;
} elsif ($state eq "set_prefs") {
	$prefs{'display'} = param('show');
	$prefs{'results'} = param('ownwin');
	$prefs{'no_of_lists'} = param('no_of_lists');
	if (   ($prefs{'text_display'} != param('text_display')) 
		&& ( ($prefs{'text_display'} == 0) || (param('text_display') == 0) )   ){
		$reload_search = 1;
	}
	$prefs{'text_display'} = param('text_display');
	&show_add;
}

&html_footer;



#################################################
#####                     		             SUBROUTINES            	             	 	   #####
#################################################

sub show_dict {
	print header;
	&html_header;

	print "<FORM ACTION=\"/~chaucer/cgi-bin/tools.cgi\" METHOD=POST>\n";
	print "<INPUT TYPE=\"hidden\" NAME=\"state\" VALUE=\"lookup\">\n";	
	print "<INPUT TYPE=\"hidden\" NAME=\"layer\" VALUE=\"top\">\n";

	&compose_dict_html;
	print $dict_html;
	print p, submit('Search Dictionary');
}


sub show_pos {
	print header;
	&html_header;

	&read_file($pos_file);
	foreach $key (sort keys %expansions) {
		my $temp = $key . ":" . $expansions{$key};
		push @expan_val, $temp;
		$expan_lab{$temp} = $expansions{$key};
	}
	
	print "<FORM ACTION=\"/~chaucer/cgi-bin/tools.cgi\" METHOD=POST TARGET=\'criteria\'>\n";
	print "<INPUT TYPE=\"hidden\" NAME=\"state\" VALUE=\"add\">\n";
	print "<INPUT TYPE=\"hidden\" NAME=\"layer\" VALUE=\"sub\">\n";

	print scrolling_list(-name=>"lemma",
					-multiple=>'true',
					-override=>1,
					-size=>4,
					-values=>\@expan_val,
					-labels=>\%expan_lab),
			p, submit('Add To Search Criteria');
	print "&nbsp;&nbsp;";
	print button(-name=>'back', 
					-value=>'Back', 
					-onClick=>"top.frames['tool'].history.go(-1)");
}



sub show_lookup {
	if ($dictionary eq "chaucer") { 
		$filename =  $chaucer_dict;
	} elsif ($dictionary eq "gower") { 
		$filename =  $gower_dict;
	} elsif ($dictionary eq "anon") { 
		$filename =  $anon_dict;
	} elsif ($dictionary eq "OED") { 
		$filename =  $OED;
	}
	
	print header;
	&html_header;

	print "<FORM ACTION=\"/~chaucer/cgi-bin/tools.cgi\" METHOD=POST TARGET=\'criteria\'>\n";
	print "<INPUT TYPE=\"hidden\" NAME=\"state\" VALUE=\"add\">\n";
	print "<INPUT TYPE=\"hidden\" NAME=\"layer\" VALUE=\"sub\">\n";

	&read_dict($filename);
	&lookup_word;
}


sub show_add {
	&compose_criteria;
	&html_header;
	&format_criteria;
}


sub new_search {
	&reset_cookie;
	&html_header;
	&format_criteria;
}


sub format_criteria {
	if ($prefs{'results'} eq "own_window") {
		$target = "_blank";
	} else { $target= "results"; }
	
	print "\n<FORM ACTION=\"/~chaucer/cgi-bin/search.cgi\" METHOD=POST TARGET=\"$target\">\n";
	print "<INPUT TYPE=\"hidden\" NAME=\"state\" VALUE=\"search\">\n";
	print "<TABLE BORDER=0>\n<TR ALIGN=\"left\">\n\t<TD></TD>\n";
	
	
	if ( ($prefs{'display'} eq "show_words") || ($prefs{'display'} eq "show_both") ) {
		print "\t<TD ALIGN=\"left\">&nbsp; " .
			"<font size=\"+1\">Words</font> &nbsp;";
		print popup_menu(-name=>'separation', 
		                            -values=>\@sep_list,
		                            -labels=>\%sep_hash,
		                            -default=>"$prefs{'separation'}");	
		print "</TD>\n";
	}
	if ($prefs{'display'} ne "show_words") {
		print "\t<TD ALIGN=\"left\">&nbsp;<font size=\"+1\">LBML Tags</font></TD>\n</TR>\n";
	}
	
	foreach $xword (sort keys %LBtags) {
		next if ($xword eq "");
		
		# handle problem with #-sign in LBML tags; change it to hex value (%23)
		$cl_word = $xword;
		$cl_word =~ s/\#/\%23/g;
		
		print "<TR>\n\t<TD><A HREF=\"/~chaucer/cgi-bin/tools.cgi?state=cl&clear=$cl_word\">" .
			"<IMG SRC=\"$basedir/images/clear.gif\" BORDER=0></A>" .
			"</TD>\n";
		if ( ($prefs{'display'} eq "show_both") || ($prefs{'display'} eq "show_words") ) {
			print "\t<TD>&nbsp;$LBtags{$xword}</TD>\n";
		}
		if ( ($prefs{'display'} eq "show_both") || ($prefs{'display'} eq "show_lbml") ) {
			print "\t<TD>&nbsp;$xword</TD>\n";
		}
		if ($prefs{'display'} eq "editable_lbml") {
			print "\t<TD>";
			print "<INPUT TYPE=\"text\" NAME=\"ed_words\" VALUE=$xword " .
				"SIZE=20 MAXLENGTH=25></TD>\n";
		}
		print "</TR>\n";
	}
	
	print "<TR ALIGN=\"left\">\n\t<TD></TD>\n" .
		"\t<TD ALIGN=\"left\">&nbsp;&nbsp;<font size=\"+1\">Texts:</font></TD>\n";
	if ($prefs{'display'} eq "show_both") {
		print "\t<TD></TD>\n";
	}
	print "</TR>\n";
	
	foreach $xtexts (sort keys %LBtexts) {
		next if ($xtexts eq "");
		print "<TR>\n\t<TD><A HREF=\"/~chaucer/cgi-bin/tools.cgi?state=cl&clear=$xtexts\">" .
			"<IMG SRC=\"$basedir/images/clear.gif\" BORDER=0></A>" .
			"</TD>\n";
		if ( ($prefs{'display'} eq "show_both") || ($prefs{'display'} eq "show_words") ) {
			print "\t<TD>&nbsp;$LBtexts{$xtexts}</TD>\n";
		}
		if  ( ($prefs{'display'} eq "show_both") || ($prefs{'display'} eq "show_lbml") ) {
			print "\t<TD>&nbsp;$xtexts</TD>\n";
		}
		if ($prefs{'display'} eq "editable_lbml") {
			print "\t<TD>"; 
			print "<INPUT TYPE=\"text\" NAME=\"ed_texts\" VALUE=$xtexts " .
				"SIZE=20 MAXLENGTH=25></TD>\n";
		}
		print "</TR>\n";
	}
	print "<TR>\n\t<TD>&nbsp;&nbsp;&nbsp;&nbsp;</TD>\n\t";
	print "<TD><IMG SRC=\"$basedir/images/dot.gif\" WIDTH=\"130\"". 
		"HEIGHT=\"1\">";
	if ($prefs{'display'} eq "show_both") {
		print "</TD>\n\t<TD>&nbsp;</TD>\n";
	}
	print "</TR>\n</TABLE>\n";
}


sub compose_criteria {
	# get new search criteria
	@new_words = $qs->param('lemma');
	@new_texts = $qs->param('newtexts');
	
	warn Dumper(\@new_texts);
	
	# add new search criteria
	foreach $temp1 (@new_words) {
		my ($key1, $title1) = split/:/, $temp1, 2;
		$LBtags{$key1} = $title1;
	}
	foreach $temp2 (@new_texts) {
		my ($key2, $title2) = split/:/, $temp2, 2;
		$LBtexts{$key2} = $title2;
	}
	
	&set_cookie;
}


sub remove_item {
	$item2remove = param('clear');
	
	#take care of problem with #-sign in LBML tags; change back from hex value (%23)
	$item2remove =~ s/\%23/\#/g;
	
	delete $LBtags{$item2remove};
	delete $LBtexts{$item2remove};
	
	&set_cookie;
	&html_header;
	&format_criteria;
}


sub lookup_word {
	# make sure word is lower case for lookup
	$word = lc($word);
	
	$markup = $dict_data{$word};
	
	if (!$markup) {
		&print_nothing_found;
		return; 
	}
	
	@lbml = split /\ /, $markup, -1;
	
	# make hash for labels used in scrolling list
	foreach $item (@lbml) {
		$tag = &lbml2human($item);
		$item .= ":" . $tag;
		# format for scrolling list
		$label_hash{$item} = $tag;
	}
	
	if ($#lbml > 0 ) {
		# add an all to list of choices so all instances can be found
		$item = $lbml[0];
		($tag, $drek) = split /\@/, $item, 2;	
		$item = $tag . ":" . $tag . ": all";
		unshift @lbml, $item;
		# add scrolling list
		$label_hash{$item} = $tag . ": all";
			
		print "\n<p><font size=\"-1\">&quot;$word&quot; occurs in multiple ";
		print "forms and contexts.<br>\nChoose one, any, or all of the below";
		print ":<br>\n &nbsp;<strong>lemma&nbsp;&nbsp;";
		print "&nbsp;&nbsp;&nbsp;&nbsp;grammar</strong></font><br>\n";
		print scrolling_list(-name=>"lemma",
							-multiple=>'true',
							-override=>1,
							-size=>3,
							-values=>\@lbml,
							-labels=>\%label_hash);
		print "\n<p>\n";
	} else { 
		print "<INPUT TYPE=\"hidden\" NAME=\"lemma\" VALUE=\"@lbml\">\n";
		print "<p>Would you like to add \"$tag.\" to the list? \n<p>\n"; 
	}
	
	print p, submit('Add To Search Criteria');
	print "&nbsp;&nbsp;";
	print button(-name=>'back', 
					-value=>'Back', 
					-onClick=>'history.go(-1)');
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
	$tag = "$parts[0]:  $parts[1]";
	return $tag;
}



sub compose_dict_html {	
	$dict_html .= "Word:";
	$dict_html .= textfield('word');
	$dict_html .= "<BR>\nDictionary:&nbsp;";
	$dict_html .= "<SELECT NAME=\"dictionary\">\n" . 
				"<OPTION VALUE=\"chaucer\">Chaucer\n" . 
				"<OPTION VALUE=\"gower\">Gower\n" . 
				"<OPTION VALUE=\"anon\">Anonymous\n" .
##				"<OPTION VALUE=\"OED\">Oxford English Dictionary\n" . 
				"</SELECT>";
	$dict_html .= "<BR>\n";
}


sub print_nothing_found {
	print "\n<p> No such word found.  Back up and try again.<p>\n ";
	print "<INPUT TYPE=\"hidden\" NAME=\"state\" VALUE=\"new\">\n";
	print button(-name=>'back', 
				-value=>'Look Up New Word', 
				-onClick=>"top.frames['tool'].history.go(-1)");
}


sub print_prefs {	
	@show_list = qw( show_both   show_words   show_lbml   ---   editable_lbml );
	%show_hash = (	"show_both" => "Show Both Words and LBML",
					"show_words" => "Show Words Only",
					"show_lbml" => "Show LBML Tags Only",
					"---" => "-----------------",
					"editable_lbml" => "Editable LBML Tags"  );
	@lists_list = qw( single   multiple );
	%lists_hash = (	"single" => "Display in one combined list",
					"multiple" => "Display each word in separate list" );
	@win_list = qw( own_window   in_frame );
	%win_list = (		"own_window" => "Yes",
					"in_frame" => "No" );
	
	@text_list = ( 0, 2, 4, 8, 14, 24, 50, 100 );
	%text_hash = (
			0 => "the whole text",			2 => "three lines at a time",
			4 => "five lines at a time",		8 => "nine lines at a time",
			14 => "fifteen lines at a time",		24 => "25 lines at a time",
			50 => "50 lines at a time",		100 => "100 lines at a time",  );

print <<"EOT";
<HTML>
<HEAD>
	<TITLE>Set Database Preferences</TITLE>
</HEAD>
<BODY BGCOLOR="#ffffff">
<FORM ACTION="/~chaucer/cgi-bin/tools.cgi" METHOD=POST TARGET="criteria">
<INPUT TYPE="hidden" NAME="state" VALUE="set_prefs">
<H3>Set your display preferences here:</H3>
<FONT SIZE="+1">Search Criteria</FONT><BR>
EOT

print popup_menu(-name=>'show', 
                            -values=>\@show_list, 
                            -labels=>\%show_hash, 
                            -default=>"$prefs{'display'}");

print "<P>\n<FONT SIZE=\"+1\">Results of Search</FONT><BR>\n";

print "1) Display results  in its own window?: <BR>\n&nbsp;&nbsp; ";
print radio_group(-name=>'ownwin', 
                                -values=>\@win_list, 
                                -default=>"$prefs{'results'}", 
                                -labels=>\%win_list);

print "<BR>\n2) For searches with more than one word:<BR>\n";
print radio_group(-name=>'no_of_lists', 
                                -values=>\@lists_list, 
                                -default=>"$prefs{'no_of_lists'}", 
                                -linebreak=>'true', 
                                -labels=>\%lists_hash);

print "<P>\n<FONT SIZE=\"+1\">Medieval Texts</FONT><BR>\nDisplay:&nbsp;";
print popup_menu(-name=>'text_display', 
                            -values=>\@text_list, 
                            -labels=>\%text_hash,
                            -default=>"$prefs{'text_display'}");
## -onChange=>"if(navigator.userAgent.indexOf('Mozilla/2') == -1) 
##			{ window.opener.top.frames['criteria'].document.forms[0].submit() }"

print <<"EOT";
<P>
<HR>
<INPUT TYPE="submit" VALUE="Set Prefences">
</FORM>
</BODY>
</HEAD>
EOT
}




#################################################
#####          I/O  SUBROUTINES             #####

sub read_dict {
	my ($filename) = @_;
	
	open DICT, "<$filename" || die "can't open dictionary: $filename\n";
					
	while (<DICT>) {
		chomp;
		# skip comments
		next if ($_ =~ /^#/ );
				
		($key, $markup) = split /\s+/, $_, 2;
		
		# load hash
		$dict_data{$key} = $markup;
	}
	
	close DICT;
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
#####           COOKIE  SUBROUTINES      	#####

sub read_cookie {
	# read old cookies
	if ($qs->cookie()) {
		%LBtags = $qs->cookie(-name=>'words');
		%LBtexts = $qs->cookie(-name=>'texts');
		if ($qs->cookie(-name=>'prefs')) {
			%prefs = $qs->cookie(-name=>'prefs');
		} else {
			$prefs{'display'} = "show_words";
			$prefs{'results'} = "in_frame";
			$prefs{'separation'} = "0";
			$prefs{'no_of_lists'} = "multiple";
			$prefs{'text_display'} = "0";
		}
	}
	warn Dumper(\%LBtags, \%LBtexts, \%prefs);
}

sub set_cookie {
	#set cookies 1 and 2
	$cookie1 = $qs->cookie(-name=>'words', -value=>\%LBtags);
	$cookie2 = $qs->cookie(-name=>'texts', -value=>\%LBtexts);
	$cookie3 = $qs->cookie(-name=>'prefs', -value=>\%prefs);
	print header(-cookie=>[$cookie1, $cookie2, $cookie3]);
}



sub reset_cookie {
	# clear cookies
	$cookie1 = $qs->cookie(-name=>'words', -value=>"");
	$cookie2 = $qs->cookie(-name=>'texts', -value=>"");
	print header(-cookie=>[$cookie1, $cookie2]);

}




#################################################
#####                     	       		   HTML  SUBROUTINES            	    	 	    #####


sub html_header {
	print "<HTML><HEAD></HEAD>\n<BODY bgcolor=\"#ffffff\" ";
	if ($reload_search && ($user_agent == -1 ) ) {
		print " onLoad=\"document.forms[0].submit()\"";	
	}
	print ">\n";
}

sub html_footer {
	print "</FORM>\n</BODY></HTML>\n";
}
